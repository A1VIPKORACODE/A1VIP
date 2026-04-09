
import { supabase } from '../lib/supabase';
import React, { ChangeEvent, useState } from 'react';

const BUCKET = 'codes';

function fileName(prefix: string, file: File) {
  const ext = file.name.split('.').pop() || 'jpg';
  return `${prefix}/${Date.now()}.${ext}`;
}

async function uploadImage(file: File, prefix: string) {
  const path = fileName(prefix, file);

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  return path;
}

export default function AdminPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    setImage(file);

    if (preview) URL.revokeObjectURL(preview);

    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleUpload = async () => {
    if (!image) return alert('اختار صورة');

    try {
      await uploadImage(image, 'bet-images');
      alert('تم رفع الصورة بالجودة الأصلية');
    } catch (err) {
      alert('حصل خطأ');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>رفع صورة بدون ضغط</h2>

      <input type="file" onChange={handleFileChange} />

      {preview && (
        <div>
          <p>معاينة:</p>
          <img src={preview} style={{ width: 300 }} />
        </div>
      )}

      <button onClick={handleUpload}>رفع</button>
    </div>
  );
}
