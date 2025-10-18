import socket
import ssl
import requests

DOMAIN_ROOT = "dantepropiedades.com.ar"
DOMAIN_WWW = "www.dantepropiedades.com.ar"

def resolve_dns(domain):
    try:
        return socket.gethostbyname(domain)
    except socket.gaierror:
        return "❌ No se pudo resolver"

def check_https(domain):
    try:
        response = requests.get(f"https://{domain}", timeout=5)
        return f"{response.status_code} {response.reason}"
    except requests.exceptions.RequestException:
        return "❌ HTTPS no disponible"

def check_redirect(domain):
    try:
        response = requests.get(f"http://{domain}", allow_redirects=False)
        return response.headers.get("Location", "No redirección")
    except:
        return "❌ Error al verificar redirección"

print("🔍 DNS Root:", resolve_dns(DOMAIN_ROOT))
print("🔍 DNS WWW:", resolve_dns(DOMAIN_WWW))
print("🌐 Redirección:", check_redirect(DOMAIN_ROOT))
print("🔒 HTTPS:", check_https(DOMAIN_WWW))