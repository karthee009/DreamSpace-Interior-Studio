import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../../config/database.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
const router = Router();
const registerSchema = z.object({name:z.string().trim().min(2).max(120),email:z.string().trim().email().max(190),password:z.string().min(8).max(100)});
router.post('/register', asyncHandler(async(req,res)=>{
 const data = registerSchema.parse(req.body);
 const exists = await query('SELECT id FROM users WHERE email=?',[data.email.toLowerCase()]);
 if(exists.length) return res.status(409).json({error:'An account with this email already exists.'});
 const hash = await bcrypt.hash(data.password,12);
 const result = await query('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)',[data.name,data.email.toLowerCase(),hash,'CUSTOMER']);
 const user = {id:result.insertId,name:data.name,email:data.email.toLowerCase(),role:'CUSTOMER'};
 req.session.user = user;
 res.status(201).json({user});
}));
router.post('/login',asyncHandler(async(req,res)=>{
 const data = z.object({email:z.string().email(),password:z.string().min(1)}).parse(req.body);
 const rows = await query('SELECT id,name,email,password_hash,role FROM users WHERE email=?',[data.email.toLowerCase()]);
 if(!rows.length || !(await bcrypt.compare(data.password,rows[0].password_hash))) return res.status(401).json({error:'Email or password is incorrect.'});
 const u=rows[0]; req.session.regenerate(err=>{ if(err) return res.status(500).json({error:'Could not start a session.'}); req.session.user={id:u.id,name:u.name,email:u.email,role:u.role}; req.session.save(e=>{if(e)return res.status(500).json({error:'Could not save session.'});res.json({user:req.session.user});});});
}));
router.get('/me',requireAuth,(req,res)=>res.json({user:req.user}));
router.post('/logout',requireAuth,(req,res)=>req.session.destroy(err=>{if(err)return res.status(500).json({error:'Could not log out.'});res.clearCookie('dreamspace.sid');res.json({message:'Logged out.'});}));
export default router;
