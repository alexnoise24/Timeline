# Network Troubleshooting Guide

## Problema: Apps no accesibles después de desconexión de red

### Síntomas
- HTTP 530 error en apps (Cloudflare no puede conectar)
- Túneles de Cloudflare caídos
- DNS no funciona

### Diagnóstico Rápido

```bash
# 1. Verificar conectividad básica
ping -c 3 1.1.1.1

# 2. Verificar DNS
ping -c 3 cloudflare.com

# 3. Ver rutas de red
ip route

# 4. Ver estado de túneles
sudo systemctl status cloudflared-timeline
sudo systemctl status cloudflared-flujo

# 5. Ver estado de aplicaciones
pm2 status
```

## Solución: Reconexión de Red

### Paso 1: Verificar gateway

```bash
# Ver si hay gateway por defecto
ip route

# Si falta el gateway, agregarlo temporalmente
sudo ip route add default via 192.168.100.1 dev enp1s0

# Probar conectividad
ping -c 3 1.1.1.1
```

### Paso 2: Verificar DNS

```bash
# Si no funciona DNS, reiniciar systemd-resolved
sudo systemctl restart systemd-resolved

# Probar
ping -c 3 cloudflare.com
```

### Paso 3: Hacer cambios permanentes

```bash
# Ver configuración de netplan
sudo cat /etc/netplan/*.yaml

# Asegurar que solo hay un archivo activo
# Si hay conflictos, deshabilitar cloud-init
sudo mv /etc/netplan/50-cloud-init.yaml /etc/netplan/50-cloud-init.yaml.disabled

# Aplicar configuración
sudo netplan apply

# Corregir permisos si aparece warning
sudo chmod 600 /etc/netplan/00-installer-config.yaml
```

### Paso 4: Verificar túneles

Los túneles deberían reconectarse automáticamente (tienen `Restart=always`).

```bash
# Ver estado
sudo systemctl status cloudflared-timeline
sudo systemctl status cloudflared-flujo

# Si no están activos, reiniciarlos manualmente
sudo systemctl restart cloudflared-timeline
sudo systemctl restart cloudflared-flujo

# Ver logs en tiempo real
sudo journalctl -u cloudflared-timeline -f
```

### Paso 5: Verificar aplicaciones

```bash
# Estado de PM2
pm2 status

# Backend local (debe responder)
curl http://localhost:5050/api/health

# Apps públicas (debe retornar 200)
curl -I https://lenzu.app
curl -I https://flujo.lenzu.app
curl -I https://galleries.alex-obregon.com
```

## Configuración de Red Actual

### Interfaces
- **enp1s0**: Ethernet principal (192.168.100.150/24)
- **wlp3s0**: WiFi (deshabilitado)
- **lo**: Loopback

### Gateway
- **Gateway por defecto**: 192.168.100.1

### DNS
- **Primario**: 1.1.1.1 (Cloudflare)
- **Secundario**: 1.0.0.1 (Cloudflare)
- **Fallback**: 8.8.8.8, 8.8.4.4 (Google)

### Túneles de Cloudflare

#### timeline-tunnel (df6f3f78-8015-4059-9c8b-464175c680be)
- **Servicio**: `cloudflared-timeline.service`
- **Hostname**: lenzu.app → localhost:5050
- **Autostart**: ✅ Enabled
- **Auto-restart**: ✅ Cada 5 segundos si falla

#### flujo-estable (3dd566e1-aa20-4c35-a642-cf229a5e2431)
- **Servicio**: `cloudflared-flujo.service`
- **Hostnames**:
  - flujo.lenzu.app → localhost:80
  - galleries.alex-obregon.com → localhost:3000
- **Autostart**: ✅ Enabled
- **Auto-restart**: ✅ Cada 5 segundos si falla

## Archivos de Configuración

### Netplan
```
/etc/netplan/00-installer-config.yaml
```

### Systemd Services
```
/etc/systemd/system/cloudflared-timeline.service
/etc/systemd/system/cloudflared-flujo.service
```

### Cloudflared Config
```
~/.cloudflared/config.yml
~/.cloudflared/*.json
```

## Comandos Útiles

### Gestión de Túneles
```bash
# Estado
sudo systemctl status cloudflared-timeline
sudo systemctl status cloudflared-flujo

# Reiniciar
sudo systemctl restart cloudflared-timeline
sudo systemctl restart cloudflared-flujo

# Logs
sudo journalctl -u cloudflared-timeline -f
sudo journalctl -u cloudflared-flujo -f

# Deshabilitar autostart (si es necesario)
sudo systemctl disable cloudflared-timeline
sudo systemctl disable cloudflared-flujo
```

### Gestión de PM2
```bash
# Estado
pm2 status

# Reiniciar todo
pm2 restart all

# Reiniciar app específica
pm2 restart timeline-api

# Logs
pm2 logs timeline-api
pm2 logs flujo-estable
pm2 logs wedding-gallery
```

### Network
```bash
# Ver interfaces
ip link show
ip addr show

# Ver rutas
ip route

# Ver DNS actual
cat /etc/resolv.conf

# Aplicar cambios de netplan
sudo netplan apply
```

## Escenarios Comunes

### 1. Cable desconectado accidentalmente
1. Reconectar cable
2. Verificar `ip route` (debe tener gateway)
3. Si falta gateway: `sudo ip route add default via 192.168.100.1 dev enp1s0`
4. Los túneles se reconectan automáticamente en ~5-10 segundos

### 2. Servidor reiniciado
- ✅ Todo debería iniciarse automáticamente
- ✅ Túneles: systemd services enabled
- ✅ Apps: PM2 con autostart
- ✅ MongoDB: systemd service
- ✅ Gateway y DNS: netplan

### 3. Internet caído por horas
- Los túneles intentarán reconectar cada 5 segundos
- Una vez que internet regrese, se conectan automáticamente
- No requiere intervención manual

### 4. DNS no funciona pero internet sí
```bash
# Reiniciar resolver
sudo systemctl restart systemd-resolved

# O configurar DNS manualmente
sudo mkdir -p /etc/systemd/resolved.conf.d/
echo -e "[Resolve]\nDNS=1.1.1.1 1.0.0.1" | sudo tee /etc/systemd/resolved.conf.d/dns.conf
sudo systemctl restart systemd-resolved
```

## Prevención

### Monitoreo
Considera configurar monitoreo automático:

```bash
# Crear script de health check
cat > ~/check-services.sh << 'EOF'
#!/bin/bash
echo "=== Services Status ==="
echo "Tunnels:"
systemctl is-active cloudflared-timeline cloudflared-flujo
echo "Apps:"
pm2 list | grep online
echo "Network:"
ping -c 1 1.1.1.1 > /dev/null && echo "Internet: OK" || echo "Internet: FAIL"
EOF

chmod +x ~/check-services.sh
```

### Backup de configuración
```bash
# Backup de archivos críticos
sudo cp /etc/netplan/00-installer-config.yaml ~/backups/
cp ~/.cloudflared/config.yml ~/backups/
```

## Contactos de Emergencia

- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **PM2 Docs**: https://pm2.keymetrics.io/docs/usage/quick-start/
- **Netplan Docs**: https://netplan.io/examples

## Última Actualización
2025-11-25 - Configuración inicial de systemd services para túneles
