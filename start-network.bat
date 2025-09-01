@echo off
echo Iniciando el servidor frontend para acceso de red local...
echo Tu IP local es: 192.168.10.196
echo El servidor estará disponible en: http://192.168.10.196:3001
echo.
echo IMPORTANTE: Asegurate de que el puerto 3001 esté abierto en el firewall
echo.
npm run start-network
