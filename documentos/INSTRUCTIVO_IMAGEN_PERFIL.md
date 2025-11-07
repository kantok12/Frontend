# Instructivo para Mostrar y Actualizar la Imagen de Perfil en el Frontend

## Obtener la URL Pública de la Imagen
Cuando subas la imagen de perfil al backend, recibirás en la respuesta el campo:

```json
{
  "profile_image_url": "http://localhost:3000/api/personal/{rut}/image/download"
}
```

Guarda esta URL en el perfil del usuario para usarla en el frontend.

---

## Mostrar la Imagen en el Frontend
Usa la URL pública como `src` en un componente `<img>`:

```jsx
<img
  src={`http://localhost:3000/api/personal/${rut}/image/download`}
  alt="Foto de perfil"
  style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '50%' }}
  onError={(e) => { e.target.src = '/img/default-profile.png'; }}
/>
```

- El evento `onError` permite mostrar una imagen por defecto si no existe la foto.

---

## Subir una Nueva Imagen
Usa un formulario con un campo tipo `file` y envía el archivo al endpoint:

```
POST http://localhost:3000/api/personal/{rut}/upload
```

El backend reemplazará automáticamente la imagen anterior.

Ejemplo de código:

```jsx
const formData = new FormData();
formData.append('file', archivo);

fetch(`http://localhost:3000/api/personal/${rut}/upload`, {
  method: 'POST',
  body: formData
})
  .then(res => res.json())
  .then(data => {
    // Actualiza la imagen en pantalla si es necesario
    setImgUrl(`http://localhost:3000/api/personal/${rut}/image/download?${Date.now()}`);
  });
```

---

## Actualizar la Imagen en Pantalla
Tras subir una nueva imagen, actualiza el `src` del `<img>` para mostrar la foto actualizada. Puedes forzar la recarga agregando un parámetro único:

```jsx
<img
  src={`http://localhost:3000/api/personal/${rut}/image/download?${Date.now()}`}
  alt="Foto de perfil"
  style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '50%' }}
/>
```

---

## Notas Adicionales
- Si el backend está en otro servidor, reemplaza `localhost` por la IP o dominio correspondiente.
- Asegúrate de que el frontend tenga permisos CORS para acceder al backend.
- El backend guarda la imagen en la carpeta:
  ```
  G:/Unidades compartidas/Unidad de Apoyo/Personal/{nombre completo} - {rut}/foto.jpg
  ```

---

## Ejemplo de Integración en React

```jsx
import React, { useState } from 'react';

function ProfileImage({ rut }) {
  const [imgUrl, setImgUrl] = useState(`http://localhost:3000/api/personal/${rut}/image/download`);

  const handleImageUpload = (archivo) => {
    const formData = new FormData();
    formData.append('file', archivo);

    fetch(`http://localhost:3000/api/personal/${rut}/upload`, {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(() => {
        // Actualiza la imagen en pantalla
        setImgUrl(`http://localhost:3000/api/personal/${rut}/image/download?${Date.now()}`);
      });
  };

  return (
    <div>
      <img
        src={imgUrl}
        alt="Foto de perfil"
        style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '50%' }}
        onError={(e) => { e.target.src = '/img/default-profile.png'; }}
      />
      <input
        type="file"
        onChange={(e) => handleImageUpload(e.target.files[0])}
      />
    </div>
  );
}

export default ProfileImage;
```