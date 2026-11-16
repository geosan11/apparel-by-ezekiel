import { createClient } from '@supabase/supabase-js';
import productsFallbackData from './products.json';
import {
  calculateResizeDimensions,
  normalizeProduct,
  loadProductsFallback,
  generateSlug,
  validateMakingDays
} from './utils.js';

// Environment variables provided by Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.trim().startsWith('http') &&
  supabaseKey.trim().length > 10
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Check if the currently authenticated user is an authorized admin in public.admins
 * @param {object} user
 * @returns {Promise<boolean>}
 */
export async function checkIsAdmin(user) {
  if (!user || !supabase) return false;
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('Error verifying admin authorization:', error);
      return false;
    }
    return Boolean(data && data.user_id === user.id);
  } catch (err) {
    console.warn('Admin check exception:', err);
    return false;
  }
}

/**
 * Fetch published storefront products ordered by sort_order and created_at.
 * Falls back to src/products.json if unconfigured, empty, or on network failure.
 * @returns {Promise<Array>}
 */
export async function fetchStorefrontProducts() {
  if (!isSupabaseConfigured || !supabase) {
    return loadProductsFallback(null, productsFallbackData);
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      if (error) console.warn('Supabase storefront fetch failed, falling back to local JSON:', error);
      return loadProductsFallback(null, productsFallbackData);
    }

    return loadProductsFallback(data, productsFallbackData);
  } catch (err) {
    console.warn('Storefront products fetch error:', err);
    return loadProductsFallback(null, productsFallbackData);
  }
}

/**
 * Fetch all products for Admin management (both published and drafts)
 * @returns {Promise<{ products: Array, error: any }>}
 */
export async function fetchAdminProducts() {
  if (!isSupabaseConfigured || !supabase) {
    return {
      products: loadProductsFallback(null, productsFallbackData),
      error: null
    };
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      return { products: [], error };
    }

    return {
      products: (data || []).map(normalizeProduct),
      error: null
    };
  } catch (err) {
    return { products: [], error: err };
  }
}

/**
 * Upsert a product into public.products
 * @param {object} product
 * @returns {Promise<{ product: object|null, error: any }>}
 */
export async function upsertProduct(product) {
  if (!supabase) {
    return { product: null, error: new Error('Supabase is not configured') };
  }

  const makingDaysRes = validateMakingDays(product.making_days);
  const payload = {
    name: product.name,
    category: product.category,
    price: Number(product.price) || 0,
    making_days: makingDaysRes.valid ? makingDaysRes.value : null,
    description: product.description || '',
    details: product.details || '',
    sizes: product.sizes || ['S', 'M', 'L', 'XL', 'XXL', 'Custom'],
    images: product.images || [],
    is_published: product.is_published !== false,
    sort_order: typeof product.sort_order === 'number' ? product.sort_order : 0
  };

  // If slug is explicitly provided or generated from name
  if (product.slug) {
    payload.slug = product.slug;
  } else {
    payload.slug = generateSlug(product.name);
  }

  try {
    let result;
    if (product.id && product.id.length > 20 && product.id.includes('-')) {
      // Existing UUID
      payload.id = product.id;
      result = await supabase
        .from('products')
        .update(payload)
        .eq('id', product.id)
        .select()
        .single();
    } else {
      // New insert
      result = await supabase
        .from('products')
        .insert([payload])
        .select()
        .single();
    }

    if (result.error) {
      return { product: null, error: result.error };
    }
    return { product: normalizeProduct(result.data), error: null };
  } catch (err) {
    return { product: null, error: err };
  }
}

/**
 * Delete a product by ID
 * @param {string} id
 * @returns {Promise<{ success: boolean, error: any }>}
 */
export async function deleteProduct(id) {
  if (!supabase || !id) {
    return { success: false, error: new Error('Cannot delete product: Supabase not configured') };
  }

  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return { success: false, error };
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Toggle published state of a product
 * @param {string} id
 * @param {boolean} isPublished
 * @returns {Promise<{ success: boolean, error: any }>}
 */
export async function toggleProductPublished(id, isPublished) {
  if (!supabase || !id) {
    return { success: false, error: new Error('Cannot toggle: Supabase not configured') };
  }

  try {
    const { error } = await supabase
      .from('products')
      .update({ is_published: isPublished })
      .eq('id', id);
    if (error) return { success: false, error };
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Process image file client-side:
 * - Resizes so neither dimension exceeds maxDimension (1600px)
 * - Compresses to webp (or jpeg) under ~500KB
 * @param {File|Blob} file
 * @param {object} options
 * @returns {Promise<{ blob: Blob, dataUrl: string, fileName: string }>}
 */
export async function processProductImage(file, { maxDimension = 1600, targetMaxBytes = 500 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image element'));
      img.onload = () => {
        try {
          const { width, height } = calculateResizeDimensions(
            img.naturalWidth || img.width,
            img.naturalHeight || img.height,
            maxDimension
          );

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Canvas 2D context not available'));
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to webp or jpeg
          const tryCompress = (mimeType, quality) => {
            return new Promise((res) => {
              canvas.toBlob((blob) => res(blob), mimeType, quality);
            });
          };

          (async () => {
            let mimeType = 'image/webp';
            let quality = 0.85;
            let blob = await tryCompress(mimeType, quality);

            if (!blob) {
              mimeType = 'image/jpeg';
              blob = await tryCompress(mimeType, quality);
            }

            // If exceeds 500KB, iteratively lower quality
            while (blob && blob.size > targetMaxBytes && quality > 0.45) {
              quality -= 0.15;
              blob = await tryCompress(mimeType, quality);
            }

            const cleanBase = (file.name || 'photo').replace(/\.[^/.]+$/, '');
            const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
            const fileName = `${cleanBase}-${Date.now()}.${ext}`;

            resolve({
              blob: blob || file,
              dataUrl: canvas.toDataURL(mimeType, quality),
              fileName
            });
          })().catch(reject);
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a processed photo blob to Supabase Storage bucket 'product-photos'
 * @param {Blob} blob
 * @param {string} fileName
 * @param {string} slugPrefix
 * @returns {Promise<{ publicUrl: string|null, error: any }>}
 */
export async function uploadProductPhoto(blob, fileName, slugPrefix = 'product') {
  if (!supabase) {
    return { publicUrl: null, error: new Error('Supabase not configured') };
  }

  try {
    const cleanPrefix = generateSlug(slugPrefix);
    const storagePath = `${cleanPrefix}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-photos')
      .upload(storagePath, blob, {
        contentType: blob.type || 'image/webp',
        upsert: true
      });

    if (uploadError) {
      return { publicUrl: null, error: uploadError };
    }

    const { data } = supabase.storage
      .from('product-photos')
      .getPublicUrl(storagePath);

    return { publicUrl: data.publicUrl, error: null };
  } catch (err) {
    return { publicUrl: null, error: err };
  }
}

/**
 * Fetch public order status using security-definer RPC get_order_status
 * Does not expose customer private contact or measurements info.
 * @param {string} reference
 * @returns {Promise<{ order: object|null, error: any }>}
 */
export async function getOrderStatus(reference) {
  if (!supabase || !reference) {
    return { order: null, error: new Error('Supabase not configured or missing reference') };
  }

  try {
    const { data, error } = await supabase.rpc('get_order_status', {
      lookup_reference: reference.trim()
    });

    if (error) {
      return { order: null, error };
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return { order: null, error: new Error('Order not found') };
    }

    return {
      order: {
        reference: reference.trim(),
        status: row.status,
        amount: Number(row.amount) || 0,
        product_name: row.product_name
      },
      error: null
    };
  } catch (err) {
    return { order: null, error: err };
  }
}

/**
 * Fetch all customer orders for admin dashboard (requires admin session)
 * @returns {Promise<{ orders: Array, error: any }>}
 */
export async function fetchAdminOrders() {
  if (!supabase) {
    return { orders: [], error: new Error('Supabase is not configured') };
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { orders: [], error };
    }

    return { orders: data || [], error: null };
  } catch (err) {
    return { orders: [], error: err };
  }
}

/**
 * Invoke Supabase Edge Function to initiate OPay Cashier payment
 * @param {object} payload
 * @returns {Promise<{ data: object|null, error: any }>}
 */
export async function createOpayPayment(payload) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured') };
  }

  try {
    const { data, error } = await supabase.functions.invoke('opay-create-payment', {
      body: payload
    });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}
