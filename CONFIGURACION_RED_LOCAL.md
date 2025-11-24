# Configuración para Red Local

Este documento explica cómo configurar y ejecutar la aplicación en una red local para que otros dispositivos puedan acceder.

## 🌐 Configuración Actual

La aplicación está configurada para funcionar en la red local con:
- **IP Frontend**: `192.168.10.146:3001` 
- **IP Backend**: `192.168.10.146:3000`

## 📝 Pasos para Configurar

### 1. Verificar IP de tu Máquina

Primero, verifica la IP de tu computadora en la red local:

```powershell
ipconfig
```

Busca la dirección IPv4 en la sección de tu adaptador de red (Wi-Fi o Ethernet).

### 2. Configurar Variables de Entorno

El archivo `.env` ya está configurado con:

```env
REACT_APP_API_URL=http://192.168.10.146:3000/api
REACT_APP_ENV=development
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

**Si tu IP es diferente**, edita el archivo `.env` y cambia la IP:

```env
REACT_APP_API_URL=http://TU_IP_AQUI:3000/api
```

### 3. Configurar el Backend

Asegúrate de que tu backend también esté configurado para aceptar conexiones desde la red local:

- El backend debe estar corriendo en `0.0.0.0:3000` o en tu IP específica
- Configurar CORS para permitir peticiones desde `http://192.168.10.146:3001`

Ejemplo de configuración CORS en el backend:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://192.168.10.146:3001'
  ],
  credentials: true
}));
```

### 4. Configurar Firewall de Windows

Permitir conexiones entrantes en los puertos 3000 y 3001:

```powershell
# Permitir puerto 3001 (Frontend)
netsh advfirewall firewall add rule name="React Dev Server" dir=in action=allow protocol=TCP localport=3001

# Permitir puerto 3000 (Backend)
netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=3000
```

## 🚀 Iniciar la Aplicación

### Opción 1: Script Automático (Recomendado)

```powershell
npm run start-network
```

Este comando:
- Configura HOST a `192.168.10.146`
- Usa puerto `3001`
- Deshabilita la verificación de host para permitir acceso remoto

### Opción 2: Desarrollo Local Normal

```powershell
npm start
```

Solo para desarrollo local en `localhost:3001`

## 🔍 Verificar Configuración

### Desde la Máquina Host

1. Abre el navegador en `http://192.168.10.146:3001`
2. Verifica en la consola del navegador (F12) que muestre:
   ```
   ApiService - baseURL: http://192.168.10.146:3000/api
   ```

### Desde Otro Dispositivo en la Red

1. Asegúrate de estar en la misma red WiFi/LAN
2. Abre el navegador en `http://192.168.10.146:3001`
3. Deberías poder acceder a la aplicación y hacer login

## 🧪 Probar Endpoints

Puedes probar que el backend sea accesible desde la red:

```powershell
# Desde PowerShell en otro dispositivo
Invoke-WebRequest -Uri "http://192.168.10.146:3000/api/health" -Method GET
```

O desde el navegador:
```
http://192.168.10.146:3000/api/health
```

## ⚠️ Solución de Problemas

### Error: "Invalid Host header"

- **Causa**: React Dev Server bloquea accesos desde IPs no autorizadas
- **Solución**: Verifica que `DANGEROUSLY_DISABLE_HOST_CHECK=true` esté en `.env`

### Error: "Network Error" o "ERR_CONNECTION_REFUSED"

- **Causa**: El backend no es accesible
- **Solución**: 
  1. Verifica que el backend esté corriendo
  2. Revisa el firewall de Windows
  3. Confirma la IP correcta con `ipconfig`

### Error: CORS

- **Causa**: El backend no permite peticiones desde la IP del frontend
- **Solución**: Agrega la IP del frontend en la configuración CORS del backend

### No Puedo Acceder desde Otro Dispositivo

1. **Verifica que ambos dispositivos estén en la misma red**
2. **Prueba hacer ping desde el otro dispositivo**:
   ```cmd
   ping 192.168.10.146
   ```
3. **Revisa el firewall de Windows** (puede estar bloqueando las conexiones)
4. **Verifica que el servidor esté escuchando en todas las interfaces** (`0.0.0.0` o la IP específica)

## 📱 Acceso desde Móviles

Para acceder desde un teléfono o tablet:

1. Conéctate a la misma red WiFi
2. Abre el navegador móvil
3. Navega a `http://192.168.10.146:3001`

## 🔒 Seguridad

⚠️ **Advertencia**: La configuración `DANGEROUSLY_DISABLE_HOST_CHECK=true` solo debe usarse en:
- Entornos de desarrollo local
- Redes privadas confiables
- **NUNCA en producción**

## 📋 Checklist Rápido

- [ ] Verificar IP con `ipconfig`
- [ ] Actualizar `.env` con la IP correcta
- [ ] Configurar CORS en el backend
- [ ] Abrir puertos en el firewall
- [ ] Ejecutar backend en `0.0.0.0:3000` o IP específica
- [ ] Ejecutar frontend con `npm run start-network`
- [ ] Probar acceso desde `http://192.168.10.146:3001`
- [ ] Verificar endpoints en la consola del navegador

## 🆘 Soporte

Si encuentras problemas:

1. Revisa la consola del navegador (F12)
2. Revisa los logs del backend
3. Verifica la configuración de red con `ipconfig`
4. Confirma que no hay otros servicios usando los puertos 3000/3001

---

**Última actualización**: Configuración para IP `192.168.10.146`
