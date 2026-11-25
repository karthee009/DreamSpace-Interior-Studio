
import { useEffect, useState } from 'react';
import { catalogueService } from '../services/services';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './SimplePages.css';

export default function CataloguePage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [success, setSuccess] = useState('');

  const { user } = useAuth();

  const canUpload =
    user && ['ADMIN', 'STAFF', 'DESIGNER'].includes(user.role);

  async function load() {
    try {
      const data = await catalogueService.list(search);
      setItems(Array.isArray(data) ? data : []);
      setError('');
    } catch (e) {
      setError(
        e.response?.data?.error ||
        e.message ||
        'Unable to load catalogue products.'
      );
    }
  }

  useEffect(() => {
    load();
  }, [search]);

  async function handleImageUpload(productId, event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadError('');
    setSuccess('');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Choose a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Image size must be 8 MB or less.');
      event.target.value = '';
      return;
    }

    try {
      setUploadingId(productId);

      await catalogueService.uploadImage(productId, file);

      setSuccess(`Image uploaded successfully for product #${productId}.`);

      await load();
    } catch (e) {
      setUploadError(
        e.response?.data?.error ||
        e.message ||
        'Image upload failed. Please try again.'
      );
    } finally {
      setUploadingId(null);
      event.target.value = '';
    }
  }

  function getImageUrl(imageUrl) {
    if (!imageUrl) {
      return '';
    }

    if (/^https?:\/\//i.test(imageUrl)) {
      return imageUrl;
    }

    const baseURL = api.defaults.baseURL || '';
    const backendOrigin = baseURL.replace(/\/api\/?$/, '');

    return `${backendOrigin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">THE COLLECTION</p>
          <h1>Furniture &amp; materials</h1>
          <p>
            Explore catalogue items and use them in your room plan.
          </p>
        </div>

        <input
          className="field"
          style={{ maxWidth: 280 }}
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      {uploadError && (
        <p className="error-text">{uploadError}</p>
      )}

      {success && (
        <p className="notice">{success}</p>
      )}

      <div className="grid-cards">
        {items.map(p => (
          <article className="panel product-card" key={p.id}>
            <div
              className="product-visual"
              style={{
                overflow: 'hidden',
                minHeight: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              {p.image_url ? (
                <img
                  src={getImageUrl(p.image_url)}
                  alt={p.name}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <>
                  <span>{p.category}</span>
                  <div className="product-shape"></div>
                </>
              )}
            </div>

            <span className="tag">
              {String(p.product_type || 'PRODUCT').replaceAll('_', ' ')}
            </span>

            <h3>{p.name}</h3>

            <p>
              {p.description || 'Product details to be confirmed.'}
            </p>

            <div className="price">
              ₹{Number(p.price).toLocaleString('en-IN')}
            </div>

            <p>
              {p.length_m} × {p.width_m} × {p.height_m} m
              {' · '}
              {p.stock_qty > 0
                ? `${p.stock_qty} in stock`
                : 'Made to order / out of stock'}
            </p>

            {canUpload && (
              <div style={{ marginTop: 16 }}>
                <label
                  htmlFor={`catalogue-image-${p.id}`}
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontWeight: 600
                  }}
                >
                  {p.image_url ? 'Replace product image' : 'Upload product image'}
                </label>

                <input
                  id={`catalogue-image-${p.id}`}
                  className="field"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploadingId !== null}
                  onChange={e => handleImageUpload(p.id, e)}
                />

                {uploadingId === p.id && (
                  <p>Uploading image...</p>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      {!items.length && !error && (
        <div className="panel">
          <p>No catalogue products found.</p>
        </div>
      )}
    </section>
  );
}
