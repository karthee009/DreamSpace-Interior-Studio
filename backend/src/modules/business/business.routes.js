
import { Router } from 'express';
import { z } from 'zod';
import { query, pool } from '../../config/database.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  roomPhotosUpload,
  catalogueImageUpload
} from '../../middleware/uploads.js';
import { buildEstimateLines, calculateTotals } from '../../utils/estimate.js';
import { canTransition } from '../../utils/orderFlow.js';
import path from 'node:path';
import fs from 'node:fs';

const router = Router();
const staff = ['ADMIN', 'DESIGNER', 'STAFF'];

// ENQUIRIES
router.post('/enquiries', asyncHandler(async (req, res) => {
  const d = z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z.string().max(40).optional(),
    message: z.string().min(5).max(4000)
  }).parse(req.body);

  const r = await query(
    'INSERT INTO enquiries(name,email,phone,message) VALUES(?,?,?,?)',
    [d.name, d.email, d.phone || null, d.message]
  );

  res.status(201).json({
    id: r.insertId,
    message: 'Enquiry submitted.'
  });
}));

router.get(
  '/enquiries',
  requireAuth,
  requireRole(...staff),
  asyncHandler(async (req, res) => {
    res.json(
      await query('SELECT * FROM enquiries ORDER BY created_at DESC')
    );
  })
);

// PROJECTS
router.get('/projects', requireAuth, asyncHandler(async (req, res) => {
  const isStaff = staff.includes(req.user.role);

  const sql = isStaff
    ? 'SELECT p.*,u.name AS customer_name FROM projects p JOIN users u ON u.id=p.user_id ORDER BY p.updated_at DESC'
    : 'SELECT p.*,u.name AS customer_name FROM projects p JOIN users u ON u.id=p.user_id WHERE p.user_id=? ORDER BY p.updated_at DESC';

  res.json(await query(sql, isStaff ? [] : [req.user.id]));
}));

router.post('/projects', requireAuth, asyncHandler(async (req, res) => {
  const d = z.object({
    title: z.string().min(2).max(180),
    description: z.string().max(4000).optional(),
    budget: z.coerce.number().min(0).max(100000000)
  }).parse(req.body);

  const r = await query(
    'INSERT INTO projects(user_id,title,description,budget) VALUES(?,?,?,?)',
    [req.user.id, d.title, d.description || null, d.budget]
  );

  res.status(201).json({
    id: r.insertId,
    title: d.title
  });
}));

router.get('/projects/:id', requireAuth, asyncHandler(async (req, res) => {
  const rows = await query(
    'SELECT * FROM projects WHERE id=?',
    [req.params.id]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  if (
    !staff.includes(req.user.role) &&
    Number(rows[0].user_id) !== Number(req.user.id)
  ) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const rooms = await query(
    'SELECT * FROM rooms WHERE project_id=? ORDER BY id',
    [req.params.id]
  );

  res.json({ ...rows[0], rooms });
}));

router.post('/projects/:id/rooms', requireAuth, asyncHandler(async (req, res) => {
  const p = await query(
    'SELECT * FROM projects WHERE id=?',
    [req.params.id]
  );

  if (!p.length) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  if (
    !staff.includes(req.user.role) &&
    Number(p[0].user_id) !== Number(req.user.id)
  ) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const d = z.object({
    name: z.string().min(2).max(120),
    roomType: z.string().max(60).default('Living room'),
    lengthM: z.coerce.number().positive().max(100),
    widthM: z.coerce.number().positive().max(100),
    heightM: z.coerce.number().positive().max(20),
    notes: z.string().max(2000).optional()
  }).parse(req.body);

  const r = await query(
    'INSERT INTO rooms(project_id,name,room_type,length_m,width_m,height_m,notes) VALUES(?,?,?,?,?,?,?)',
    [
      req.params.id,
      d.name,
      d.roomType,
      d.lengthM,
      d.widthM,
      d.heightM,
      d.notes || null
    ]
  );

  res.status(201).json({ id: r.insertId, ...d });
}));

// ROOM PHOTO UPLOAD
router.post(
  '/rooms/:id/photos',
  requireAuth,
  roomPhotosUpload.array('photos', 8),
  asyncHandler(async (req, res) => {
    const rooms = await query(
      'SELECT r.*,p.user_id FROM rooms r JOIN projects p ON p.id=r.project_id WHERE r.id=?',
      [req.params.id]
    );

    if (!rooms.length) {
      for (const f of req.files || []) {
        fs.unlink(f.path, () => {});
      }

      return res.status(404).json({ error: 'Room not found.' });
    }

    if (
      !staff.includes(req.user.role) &&
      Number(rooms[0].user_id) !== Number(req.user.id)
    ) {
      for (const f of req.files || []) {
        fs.unlink(f.path, () => {});
      }

      return res.status(403).json({ error: 'Access denied.' });
    }

    const output = [];

    for (const f of req.files || []) {
      const r = await query(
        'INSERT INTO room_photos(room_id,stored_name,original_name,mime_type,size_bytes) VALUES(?,?,?,?,?)',
        [
          req.params.id,
          f.filename,
          path.basename(f.originalname),
          f.mimetype,
          f.size
        ]
      );

      output.push({
        id: r.insertId,
        originalName: path.basename(f.originalname)
      });
    }

    res.status(201).json({ photos: output });
  })
);

router.get('/rooms/:id/photos', requireAuth, asyncHandler(async (req, res) => {
  const rooms = await query(
    'SELECT r.*,p.user_id FROM rooms r JOIN projects p ON p.id=r.project_id WHERE r.id=?',
    [req.params.id]
  );

  if (!rooms.length) {
    return res.status(404).json({ error: 'Room not found.' });
  }

  if (
    !staff.includes(req.user.role) &&
    Number(rooms[0].user_id) !== Number(req.user.id)
  ) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  res.json(
    await query(
      'SELECT id,original_name,mime_type,size_bytes,created_at FROM room_photos WHERE room_id=? ORDER BY id DESC',
      [req.params.id]
    )
  );
}));

// CATALOGUE LIST
router.get('/catalogue', asyncHandler(async (req, res) => {
  const search = `%${String(req.query.search || '').slice(0, 100)}%`;

  res.json(
    await query(
      'SELECT * FROM products WHERE active=TRUE AND (name LIKE ? OR category LIKE ?) ORDER BY category,name',
      [search, search]
    )
  );
}));

// CREATE CATALOGUE PRODUCT
router.post(
  '/catalogue',
  requireAuth,
  requireRole(...staff),
  asyncHandler(async (req, res) => {
    const d = z.object({
      name: z.string().min(2).max(180),
      category: z.string().min(2).max(100),
      productType: z.enum([
        'READY_MADE',
        'CUSTOM_MADE',
        'MATERIAL'
      ]).default('READY_MADE'),
      description: z.string().max(4000).optional(),
      lengthM: z.coerce.number().positive().max(100),
      widthM: z.coerce.number().positive().max(100),
      heightM: z.coerce.number().positive().max(100),
      price: z.coerce.number().min(0),
      stockQty: z.coerce.number().int().min(0).max(1000000),
      lowStockThreshold: z.coerce.number().int().min(0).max(100000)
    }).parse(req.body);

    const r = await query(
      'INSERT INTO products(name,category,product_type,description,length_m,width_m,height_m,price,stock_qty,low_stock_threshold) VALUES(?,?,?,?,?,?,?,?,?,?)',
      [
        d.name,
        d.category,
        d.productType,
        d.description || null,
        d.lengthM,
        d.widthM,
        d.heightM,
        d.price,
        d.stockQty,
        d.lowStockThreshold
      ]
    );

    res.status(201).json({ id: r.insertId, ...d });
  })
);

// UPLOAD / REPLACE CATALOGUE PRODUCT IMAGE
router.post(
  '/catalogue/:id/image',
  requireAuth,
  requireRole(...staff),
  catalogueImageUpload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: 'Please select an image to upload.'
      });
    }

    try {
      const products = await query(
        'SELECT id FROM products WHERE id=?',
        [req.params.id]
      );

      if (!products.length) {
        fs.unlink(req.file.path, () => {});

        return res.status(404).json({
          error: 'Product not found.'
        });
      }

      const imageUrl = `/uploads/catalogue/${req.file.filename}`;

      await query(
        'UPDATE products SET image_url=? WHERE id=?',
        [imageUrl, req.params.id]
      );

      res.status(200).json({
        message: 'Catalogue image uploaded successfully.',
        productId: Number(req.params.id),
        imageUrl
      });
    } catch (error) {
      fs.unlink(req.file.path, () => {});
      throw error;
    }
  })
);

// UPDATE STOCK
router.patch(
  '/catalogue/:id/stock',
  requireAuth,
  requireRole(...staff),
  asyncHandler(async (req, res) => {
    const d = z.object({
      delta: z.coerce.number().int().min(-1000000).max(1000000),
      reason: z.string().min(3).max(255)
    }).parse(req.body);

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [rows] = await conn.execute(
        'SELECT stock_qty FROM products WHERE id=? FOR UPDATE',
        [req.params.id]
      );

      if (!rows.length) {
        await conn.rollback();
        return res.status(404).json({ error: 'Product not found.' });
      }

      const next = rows[0].stock_qty + d.delta;

      if (next < 0) {
        await conn.rollback();
        return res.status(400).json({
          error: 'Stock cannot become negative.'
        });
      }

      await conn.execute(
        'UPDATE products SET stock_qty=? WHERE id=?',
        [next, req.params.id]
      );

      await conn.execute(
        'INSERT INTO stock_movements(product_id,user_id,quantity_delta,reason) VALUES(?,?,?,?)',
        [req.params.id, req.user.id, d.delta, d.reason]
      );

      await conn.commit();

      res.json({
        productId: Number(req.params.id),
        stockQty: next
      });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  })
);

// STOCK MOVEMENTS
router.get(
  '/stock-movements',
  requireAuth,
  requireRole(...staff),
  asyncHandler(async (req, res) => {
    res.json(
      await query(
        'SELECT sm.*,p.name AS product_name,u.name AS user_name FROM stock_movements sm JOIN products p ON p.id=sm.product_id JOIN users u ON u.id=sm.user_id ORDER BY sm.created_at DESC LIMIT 500'
      )
    );
  })
);

// SAVE DESIGN
router.post('/designs', requireAuth, asyncHandler(async (req, res) => {
  const d = z.object({
    projectId: z.coerce.number().int().positive(),
    roomId: z.coerce.number().int().positive(),
    name: z.string().min(2).max(180),
    scene: z.record(z.any())
  }).parse(req.body);

  const p = await query(
    'SELECT * FROM projects WHERE id=?',
    [d.projectId]
  );

  if (!p.length) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  if (
    !staff.includes(req.user.role) &&
    Number(p[0].user_id) !== Number(req.user.id)
  ) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const room = await query(
    'SELECT id FROM rooms WHERE id=? AND project_id=?',
    [d.roomId, d.projectId]
  );

  if (!room.length) {
    return res.status(400).json({
      error: 'Room does not belong to project.'
    });
  }

  const v = await query(
    'SELECT COALESCE(MAX(version_no),0)+1 AS next FROM designs WHERE room_id=?',
    [d.roomId]
  );

  const r = await query(
    'INSERT INTO designs(project_id,room_id,name,scene_json,version_no,created_by) VALUES(?,?,?,?,?,?)',
    [
      d.projectId,
      d.roomId,
      d.name,
      JSON.stringify(d.scene),
      v[0].next,
      req.user.id
    ]
  );

  res.status(201).json({
    id: r.insertId,
    versionNo: v[0].next
  });
}));

router.get('/designs/:projectId', requireAuth, asyncHandler(async (req, res) => {
  const p = await query(
    'SELECT * FROM projects WHERE id=?',
    [req.params.projectId]
  );

  if (!p.length) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  if (
    !staff.includes(req.user.role) &&
    Number(p[0].user_id) !== Number(req.user.id)
  ) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  res.json(
    await query(
      'SELECT id,room_id,name,scene_json,version_no,approved,created_at FROM designs WHERE project_id=? ORDER BY version_no DESC',
      [req.params.projectId]
    )
  );
}));

// ESTIMATES
router.post('/estimates', requireAuth, asyncHandler(async (req, res) => {
  const d = z.object({
    items: z.array(z.object({
      productId: z.coerce.number().int().positive(),
      quantity: z.coerce.number().int().min(1).max(1000)
    })).min(1).max(100)
  }).parse(req.body);

  const ids = d.items.map(x => x.productId);

  const products = await query(
    `SELECT id,name,price,product_type FROM products WHERE active=TRUE AND id IN (${ids.map(() => '?').join(',')})`,
    ids
  );

  if (products.length !== new Set(ids).size) {
    return res.status(400).json({
      error: 'One or more products are unavailable.'
    });
  }

  const lines = buildEstimateLines(d.items, products);
  const { subtotal, taxAmount, total } = calculateTotals(lines, 0);

  res.json({
    items: lines,
    subtotal,
    taxRate: 0,
    taxAmount,
    total,
    currency: 'INR',
    note: 'Estimate only; labour, delivery, installation and taxes are not included unless configured.'
  });
}));

// CREATE QUOTATION
router.post(
  '/quotations',
  requireAuth,
  requireRole(...staff),
  asyncHandler(async (req, res) => {
    const d = z.object({
      projectId: z.coerce.number().int().positive(),
      items: z.array(z.object({
        description: z.string().min(1).max(200),
        quantity: z.coerce.number().int().positive(),
        unitPrice: z.coerce.number().min(0)
      })).min(1),
      taxRate: z.coerce.number().min(0).max(40),
      validUntil: z.string().date().optional()
    }).parse(req.body);

    const p = await query(
      'SELECT id FROM projects WHERE id=?',
      [d.projectId]
    );

    if (!p.length) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const { subtotal, taxAmount, total } = calculateTotals(d.items, d.taxRate);
    const quoteNumber = `DS-${Date.now()}`;

    const r = await query(
      'INSERT INTO quotations(project_id,created_by,quote_number,items_json,subtotal,tax_rate,tax_amount,total,valid_until) VALUES(?,?,?,?,?,?,?,?,?)',
      [
        d.projectId,
        req.user.id,
        quoteNumber,
        JSON.stringify(d.items),
        subtotal,
        d.taxRate,
        taxAmount,
        total,
        d.validUntil || null
      ]
    );

    res.status(201).json({
      id: r.insertId,
      quoteNumber,
      subtotal,
      taxRate: d.taxRate,
      taxAmount,
      total
    });
  })
);

router.get('/quotations', requireAuth, asyncHandler(async (req, res) => {
  const isStaff = staff.includes(req.user.role);

  const sql = isStaff
    ? 'SELECT q.* FROM quotations q ORDER BY q.created_at DESC'
    : 'SELECT q.* FROM quotations q JOIN projects p ON p.id=q.project_id WHERE p.user_id=? ORDER BY q.created_at DESC';

  res.json(await query(sql, isStaff ? [] : [req.user.id]));
}));

router.get('/quotations/:id/pdf', requireAuth, asyncHandler(async (req, res) => {
  const isStaff = staff.includes(req.user.role);

  const sql = isStaff
    ? 'SELECT q.*,p.title FROM quotations q JOIN projects p ON p.id=q.project_id WHERE q.id=?'
    : 'SELECT q.*,p.title FROM quotations q JOIN projects p ON p.id=q.project_id WHERE q.id=? AND p.user_id=?';

  const rows = await query(
    sql,
    isStaff ? [req.params.id] : [req.params.id, req.user.id]
  );

  if (!rows.length) {
    return res.status(404).json({ error: 'Quotation not found.' });
  }

  const PDFDocument = (await import('pdfkit')).default;
  const q = rows[0];

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${q.quote_number}.pdf"`
  );

  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(res);
  doc.fontSize(22).text('DreamSpace Interior Studio');
  doc.moveDown().fontSize(16).text(`Quotation ${q.quote_number}`);
  doc.fontSize(11)
    .text(`Project: ${q.title}`)
    .text(`Status: ${q.status}`)
    .text(`Date: ${new Date(q.created_at).toLocaleDateString()}`);

  doc.moveDown().fontSize(12).text('Items', { underline: true });

  const items = typeof q.items_json === 'string'
    ? JSON.parse(q.items_json)
    : q.items_json;

  for (const i of items) {
    doc.text(
      `${i.description} | Qty ${i.quantity} | ₹${Number(i.unitPrice).toFixed(2)} each | ₹${(i.quantity * i.unitPrice).toFixed(2)}`
    );
  }

  doc.moveDown()
    .text(`Subtotal: ₹${Number(q.subtotal).toFixed(2)}`)
    .text(`Tax (${q.tax_rate}%): ₹${Number(q.tax_amount).toFixed(2)}`)
    .fontSize(15)
    .text(`Total: ₹${Number(q.total).toFixed(2)}`);

  doc.end();
}));

// QUOTATION STATUS
router.patch('/quotations/:id/status', requireAuth, asyncHandler(async (req, res) => {
  const d = z.object({
    status: z.enum(['SENT', 'ACCEPTED', 'REJECTED'])
  }).parse(req.body);

  const q = await query(
    'SELECT q.*,p.user_id FROM quotations q JOIN projects p ON p.id=q.project_id WHERE q.id=?',
    [req.params.id]
  );

  if (!q.length) {
    return res.status(404).json({ error: 'Quotation not found.' });
  }

  if (
    !staff.includes(req.user.role) &&
    Number(q[0].user_id) !== Number(req.user.id)
  ) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  if (
    !staff.includes(req.user.role) &&
    !['ACCEPTED', 'REJECTED'].includes(d.status)
  ) {
    return res.status(403).json({
      error: 'Customers may accept or reject a quotation.'
    });
  }

  await query(
    'UPDATE quotations SET status=? WHERE id=?',
    [d.status, req.params.id]
  );

  res.json({
    id: Number(req.params.id),
    status: d.status
  });
}));

// ORDERS
router.get('/orders', requireAuth, asyncHandler(async (req, res) => {
  const isStaff = staff.includes(req.user.role);

  const sql = isStaff
    ? 'SELECT o.*,p.title FROM orders o JOIN projects p ON p.id=o.project_id ORDER BY o.created_at DESC'
    : 'SELECT o.*,p.title FROM orders o JOIN projects p ON p.id=o.project_id WHERE p.user_id=? ORDER BY o.created_at DESC';

  res.json(await query(sql, isStaff ? [] : [req.user.id]));
}));

router.post('/orders', requireAuth, asyncHandler(async (req, res) => {
  const d = z.object({
    projectId: z.coerce.number().int().positive(),
    quotationId: z.coerce.number().int().positive().optional(),
    notes: z.string().max(2000).optional()
  }).parse(req.body);

  const p = await query(
    'SELECT * FROM projects WHERE id=?',
    [d.projectId]
  );

  if (!p.length) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  if (
    !staff.includes(req.user.role) &&
    Number(p[0].user_id) !== Number(req.user.id)
  ) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  if (d.quotationId) {
    const q = await query(
      'SELECT id,status,project_id FROM quotations WHERE id=?',
      [d.quotationId]
    );

    if (
      !q.length ||
      Number(q[0].project_id) !== d.projectId ||
      q[0].status !== 'ACCEPTED'
    ) {
      return res.status(400).json({
        error: 'Order requires an accepted quotation from this project.'
      });
    }
  }

  const r = await query(
    'INSERT INTO orders(project_id,quotation_id,notes) VALUES(?,?,?)',
    [d.projectId, d.quotationId || null, d.notes || null]
  );

  res.status(201).json({
    id: r.insertId,
    status: 'PENDING'
  });
}));

router.patch(
  '/orders/:id/status',
  requireAuth,
  requireRole(...staff),
  asyncHandler(async (req, res) => {
    const d = z.object({
      status: z.enum([
        'CONFIRMED',
        'IN_PRODUCTION',
        'READY',
        'DELIVERED',
        'INSTALLED',
        'CANCELLED'
      ])
    }).parse(req.body);

    const rows = await query(
      'SELECT id,status FROM orders WHERE id=?',
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (!canTransition(rows[0].status, d.status)) {
      return res.status(400).json({
        error: `Invalid order transition: ${rows[0].status} → ${d.status}`
      });
    }

    await query(
      'UPDATE orders SET status=? WHERE id=?',
      [d.status, req.params.id]
    );

    res.json({
      id: Number(req.params.id),
      status: d.status
    });
  })
);

// REPORT SUMMARY
router.get(
  '/reports/summary',
  requireAuth,
  requireRole(...staff),
  asyncHandler(async (req, res) => {
    const [users, projects, enquiries, orders, inventory] =
      await Promise.all([
        query('SELECT COUNT(*) AS count FROM users'),
        query('SELECT COUNT(*) AS count FROM projects'),
        query("SELECT COUNT(*) AS count FROM enquiries WHERE status='NEW'"),
        query("SELECT COUNT(*) AS count FROM orders WHERE status NOT IN ('INSTALLED','CANCELLED')"),
        query('SELECT COUNT(*) AS count FROM products WHERE stock_qty<=low_stock_threshold')
      ]);

    res.json({
      customers: users[0].count,
      projects: projects[0].count,
      newEnquiries: enquiries[0].count,
      activeOrders: orders[0].count,
      lowStockProducts: inventory[0].count
    });
  })
);

export default router;
