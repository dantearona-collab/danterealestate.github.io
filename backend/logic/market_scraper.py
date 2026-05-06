import logging

# Configurar logging INMEDIATAMENTE al inicio
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Luego el resto de imports
import hashlib
import os
import sys
import json
import time
import random
import re
import requests
from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from urllib.parse import urlparse



# ========================================
# IMPORTAR CONSTANTES CENTRALIZADAS
# ========================================
try:
    # Si se ejecuta como módulo (desde la carpeta logic)
    from .constants import (
        BARRIOS_VALIDOS,
        BARRIOS_DISPLAY,
        UBICACIONES_EXCLUIDAS,
        BARRIOS_URL_MAP,
        USD_RATE
    )
    print("✅ Constantes importadas desde .constants")
except ImportError:
    try:
        # Si se ejecuta directamente (desde la carpeta backend/logic)
        from constants import (
            BARRIOS_VALIDOS,
            BARRIOS_DISPLAY,
            UBICACIONES_EXCLUIDAS,
            BARRIOS_URL_MAP,
            USD_RATE
        )
        print("✅ Constantes importadas desde constants")
    except ImportError as e:
        print(f"⚠️ Error importando constantes: {e}")
        # Fallback manual
        BARRIOS_VALIDOS = ['belgrano', 'palermo', 'recoleta', 'microcentro', 'puerto madero']
        BARRIOS_DISPLAY = {}
        UBICACIONES_EXCLUIDAS = ['general belgrano', 'villa general belgrano']
        BARRIOS_URL_MAP = {}
        USD_RATE = 1200.0

# Resto del código...

# ========================================
# ESTRUCTURAS DE DATOS
# ========================================

@dataclass
class PropertyData:
    """Representa una propiedad extraída de cualquier portal"""
    source: str
    external_id: str
    title: str
    price_amount: float
    price_currency: str
    price_per_m2: float
    surface_total: float
    surface_covered: float
    location: str
    address: str
    property_type: str
    operation_type: str
    rooms: Optional[int] = None
    url: str = ""
    raw_data: Dict = field(default_factory=dict)

@dataclass
class MarketStats:
    """Estadísticas calculadas del mercado"""
    zone: str
    operation_type: str
    property_type: str
    sample_size: int
    average_total_price: Optional[float]
    median_total_price: Optional[float]
    average_price_per_m2: Optional[float]
    median_price_per_m2: Optional[float]
    min_price_per_m2: Optional[float]
    max_price_per_m2: Optional[float]
    price_range_total: Optional[str]
    currency_distribution: Dict[str, int]
    source_breakdown: Dict[str, int]
    properties: List[Dict] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    usd_rate: float = 1200.0

# ========================================
# CLASE BASE DEL SCRAPER
# ========================================


def normalize_url(url: str) -> str:
        if not url:
            return ""
    
        url = url.lower().strip()

        # eliminar params
        url = url.split("?")[0]

        # eliminar trailing slash
        url = url.rstrip("/")

        # eliminar www
        url = url.replace("www.", "")

        return url
    
def clean_text(text: str) -> str:
    if not text:
        return ""

    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\w\s]", "", text)

    return text.strip()



def generate_fingerprint(prop) -> str:
    try:
        price = normalize_price(
            getattr(prop, "price", None) or prop.get("price", "")
        )

        surface = normalize_surface(
            getattr(prop, "surface", None) or prop.get("surface", "")
        )

        barrio = normalize_barrio(
            getattr(prop, "barrio", None) or prop.get("barrio", "")
        )

        base = f"{price}_{surface}_{barrio}"

        return hashlib.md5(base.encode()).hexdigest()

    except Exception:
        return ""

def es_barrio_valido(texto: str, barrio_objetivo: str) -> bool:
        if not texto:
            return False

        texto = texto.lower()
        barrio = barrio_objetivo.lower()

        # match exacto como palabra (evita "belgrano r", etc.)
        match = re.search(rf"\b{re.escape(barrio)}\b", texto)

        if not match:
            return False

        # exclusiones genéricas
        exclusiones = [
            "cerca de",
            "a metros de",
            "próximo a",
            "zona",
        ]

        for ex in exclusiones:
            if ex in texto:
                return False

        return True
    
def normalize_surface(surface):
        if not surface:
            return ""

        surface = str(surface).lower()
        surface = re.sub(r"[^\d]", "", surface)  # deja solo números

        return surface


def normalize_price(price):
        if not price:
            return ""

        price = str(price)
        price = re.sub(r"[^\d]", "", price)

        return price
    
    
def normalize_barrio(barrio: str) -> str:
        if not barrio:
            return ""

        barrio = barrio.lower()

        if "belgrano" in barrio:
            return "belgrano"

        return barrio   
    
def normalize_text(text):
    import re
    text = (text or "").lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()




def is_exact_barrio(texto, barrio_objetivo):
    texto = normalize_text(texto)
    barrio_objetivo = normalize_text(barrio_objetivo)

    # match exacto tipo palabra completa
    pattern = rf"\b{re.escape(barrio_objetivo)}\b"

    if not re.search(pattern, texto):
        return False

    # excluir variantes
    blacklist = ["r", "c", "norte", "sur", "este", "oeste"]

    for suffix in blacklist:
        if f"{barrio_objetivo} {suffix}" in texto:
            return False

    return True

 

        
    

    
    













class BaseScraper(ABC):
    """Clase base para todos los scrapers de portales inmobiliarios"""
    
    def __init__(self, base_url: str, source_name: str):
        self.base_url = base_url
        self.source_name = source_name
        self.target_zone = ""  # Barrio actual que se está buscando
        self.session = requests.Session()
        self._setup_session()
    
    def _setup_session(self):
        """Configura la sesión con headers anti-bot"""
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
        ]
        
        self.session.headers.update({
            "User-Agent": random.choice(user_agents),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0"
        })
    
    
    
    
    
    
    
    
    
    
    def _normalize_zone(self, zone: str) -> str:
        """Normaliza el nombre del barrio para URLs"""
        if not zone:
            return ""
        z = zone.lower().strip()
        
        # Eliminar 's' final de error común (luganos -> lugano)
        # pero NO para barrios que terminan en s (flores, mataderos, etc)
        barrios_con_s = ["flores", "mataderos", "lomas", "pompeya", "chacrita"] # pompeya no, mataderos sí
        if z.endswith('s') and z not in barrios_con_s and not z.endswith('es'):
             z = z[:-1]

        # ✅ MEJORADO: Usar constantes centralizadas
        try:
            from .constants import BARRIOS_URL_MAP
        except:
            try: from constants import BARRIOS_URL_MAP
            except: BARRIOS_URL_MAP = {}
        
        if z in BARRIOS_URL_MAP:
            return BARRIOS_URL_MAP[z]
            
        return z.replace(" ", "-")

    def _clean_price(self, price_text: str) -> tuple:
        """
        Limpia texto de precio y devuelve (amount, currency).
        """
        
        if not price_text:
            return 0.0, "ARS"
        
        original_text = price_text
        price_text = price_text.strip().upper()
        
        # ========================================
        # 1. DETECCIÓN DE MONEDA (MEJORADA)
        # ========================================
        currency = "ARS"  # Por defecto
        
        # Detectar explícitamente dólares
        usd_indicators = ["US$", "U$S", "USD", "DÓLARES", "DOLARES", "USS"]
        for indicator in usd_indicators:
            if indicator in price_text:
                currency = "USD"
                # Si encontramos US$, eliminamos el símbolo para no confundir después
                if indicator == "US$" or indicator == "U$S":
                    price_text = price_text.replace(indicator, "")
                break
        
        # ========================================
        # 2. LIMPIEZA DE TEXTO Y MANEJO DE DECIMALES
        # ========================================
        # Manejar casos con "+" (precio + expensas)
        if '+' in price_text:
            price_text = price_text.split('+')[0].strip()
        
        # Eliminar "EXPENSAS", "ALQUILER", etc.
        price_text = re.sub(r'(EXPENSAS|ALQUILER|VENTA|DESDE|HASTA|MES|DÍA|NOCHE).*', '', price_text, flags=re.IGNORECASE)
        
        # Manejar coma decimal argentina (1.234,56 -> 1.234)
        if ',' in price_text:
            partes = price_text.split(',')
            # Si lo que sigue a la última coma son 1 o 2 dígitos, son centavos
            if len(partes[-1].strip()) <= 2:
                price_text = ','.join(partes[:-1])
            # Si no, simplemente quitar la coma (posible separador de miles alternativo)
            price_text = price_text.replace(',', '')

        # Eliminar cualquier símbolo de moneda que haya quedado
        price_text = re.sub(r'[$€£]|AR\$', '', price_text)
        
        # ========================================
        # 3. EXTRACCIÓN DE NÚMEROS
        # ========================================
        # Extraer todos los grupos de números
        all_numbers = re.findall(r'[\d.]+', price_text)
        
        if not all_numbers:
            return 0.0, currency
        
        # Limpiar puntos de miles y convertir a número
        clean_numbers = []
        for num_str in all_numbers:
            # Eliminar puntos (separadores de miles) pero mantener el número
            clean_num = num_str.replace('.', '')
            if clean_num.isdigit():
                clean_numbers.append(clean_num)
        
        if not clean_numbers:
            return 0.0, currency
        
        # ========================================
        # 4. SELECCIONAR EL NÚMERO MÁS PROBABLE
        # ========================================
        # El primer número suele ser el precio principal
        full_number = clean_numbers[0]
        
        # Si hay más números y el primero es muy corto, considerar unirlos
        if len(clean_numbers) >= 2 and len(clean_numbers[0]) < 4:
            # Posiblemente es un número partido (ej: "150" "000")
            full_number = ''.join(clean_numbers[:3])  # Unir hasta 3 grupos
        
        try:
            value = float(full_number)
        except ValueError:
            return 0.0, currency
        
        # ========================================
        # 5. VALIDACIÓN POR RANGOS (MEJORADA)
        # ========================================
        # Rangos realistas para inmuebles en Argentina
        if currency == "USD":
            # USD: 10,000 - 3,000,000 (alquileres desde 10k USD, propiedades hasta 3M USD)
            min_price = 5_000
            max_price = 3_000_000
            
            # Si el precio está fuera de rango pero es plausible como ARS, corregir moneda
            if value < min_price or value > max_price:
                # Verificar si es un precio típico en ARS
                if 50_000 <= value <= 500_000_000:
                    currency = "ARS"
        else:
            # ARS: 30,000 - 500,000,000
            min_price = 30_000
            max_price = 500_000_000
            
            # Si el precio es muy bajo para ARS pero típico en USD, corregir
            if value < min_price and 10_000 <= value <= 3_000_000:
                currency = "USD"
        
        # Validar rango final
        if min_price <= value <= max_price:
            return value, currency
        
        # ========================================
        # 6. FALLBACK: intentar con otros números
        # ========================================
        for num_str in clean_numbers[1:4]:  # Probar los siguientes números
            try:
                val = float(num_str)
                if min_price <= val <= max_price:
                    return val, currency
            except ValueError:
                continue
        
        return 0.0, currency
    
    
    
    
    
    def _clean_surface(self, surface_text: str) -> float:
        """
        Limpia texto de superficie y devuelve metros cuadrados
        Ej: "85 m²" -> 85.0
        """
        if not surface_text:
            return 0.0
        
        # Extraer números
        numbers = re.findall(r'[\d.,]+', surface_text)
        if not numbers:
            return 0.0
        
        try:
            surface = float(numbers[0].replace(',', '.'))
            return surface
        except ValueError:
            return 0.0
    
    def _calculate_price_per_m2(self, price: float, surface: float, currency: str) -> float:
        """Calcula precio por metro cuadrado"""
        if surface <= 0:
            return 0.0
        return price / surface
    
    def _make_request(self, url: str, max_retries: int = 3) -> Optional[str]:
        """Realiza request con reintentos y delay"""
        for attempt in range(max_retries):
            try:
                # Delay aleatorio para evitar bloqueos
                time.sleep(random.uniform(1.5, 3.5))
                
                response = self.session.get(url, timeout=30)
                
                if response.status_code == 200:
                    return response.text
                elif response.status_code in [429, 403, 503]:
                    wait_time = (2 ** attempt) * random.uniform(2, 4)
                    logger.warning(f"[{self.source_name}] Error {response.status_code}, esperando {wait_time:.1f}s...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"[{self.source_name}] Error {response.status_code}: {url}")
                    
            except Exception as e:
                logger.error(f"[{self.source_name}] Exception: {e}")
                time.sleep(random.uniform(2, 4))
        
        logger.error(f"[{self.source_name}] Falló después de {max_retries} intentos")
        return None
    
    @abstractmethod
    def build_url(self, zone: str, operation: str, property_type: str) -> str:
        """Construye la URL de búsqueda"""
        pass
    
    @abstractmethod
    def parse_properties(self, html: str) -> List[PropertyData]:
        """Parsea el HTML y extrae propiedades"""
        pass

    def _render_with_selenium(self, url: str) -> Optional[str]:
        """
        Usa Selenium con Edge para renderizar JavaScript.
        """
        driver = None
        try:
            from selenium import webdriver
            from selenium.webdriver.edge.options import Options
            from selenium.webdriver.edge.service import Service
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            from webdriver_manager.microsoft import EdgeChromiumDriverManager
            import time
            
            # Configurar Edge en modo headless
            edge_options = Options()
            edge_options.add_argument("--headless")
            edge_options.add_argument("--no-sandbox")
            edge_options.add_argument("--disable-dev-shm-usage")
            edge_options.add_argument("--disable-gpu")
            edge_options.add_argument("--window-size=1920,1080")
            # User agent real para evitar detección de headless
            edge_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0")
            edge_options.add_argument("--disable-blink-features=AutomationControlled")
            edge_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            edge_options.add_experimental_option("useAutomationExtension", False)
            
            # Inicializar driver con manager para asegurar que el driver existe
            try:
                service = Service(EdgeChromiumDriverManager().install())
                driver = webdriver.Edge(service=service, options=edge_options)
            except Exception as e_driver:
                logger.warning(f"[{self.source_name}] No se pudo usar webdriver-manager, intentando directo: {e_driver}")
                driver = webdriver.Edge(options=edge_options)
            
            # Ejecutar script para deshabilitar indicador de webdriver
            driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                'source': 'Object.defineProperty(navigator, "webdriver", {get: () => undefined})'
            })
            
            logger.info(f"[{self.source_name}] Navegando a: {url}")
            driver.get(url)
            
            # Esperar a que aparezcan los resultados (Zonaprop es pesado)
            wait = WebDriverWait(driver, 25)
            try:
                # Buscar cualquier indicador de que hay contenido
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "body")))
                # Dar un tiempo extra generoso para Zonaprop y otros sitios reactivos
                time.sleep(random.uniform(8, 12))
            except:
                logger.warning(f"[{self.source_name}] Timeout esperando carga completa, continuando...")
            
            # Intentar scroll para cargar contenido perezoso
            try:
                driver.execute_script("window.scrollTo(0, 800);")
                time.sleep(1)
            except:
                pass
            
            html = driver.page_source
            logger.info(f"[{self.source_name}] Exito: {len(html)} bytes")
            return html
            
        except Exception as e:
            logger.error(f"[{self.source_name}] Error fatal en Selenium: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return None
        finally:
            if driver:
                try:
                    driver.quit()
                except:
                    pass

    def _render_with_playwright(self, url: str) -> Optional[str]:
        """Fallback con Playwright si Selenium falla"""
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(url, wait_until="networkidle", timeout=60000)
                html = page.content()
                browser.close()
                return html
        except Exception as e:
            logger.error(f"[{self.source_name}] Error con Playwright: {e}")
            return None

# ========================================
# SCRAPER DE ARGENPROP
# ========================================


# ========================================
# SCRAPER DE ZONAPROP
# ========================================

class ZonapropScraper(BaseScraper):
    """Scraper específico para Zonaprop"""
    
    def __init__(self):
        super().__init__("https://www.zonaprop.com.ar", "zonaprop")
        self.target_zone = ""  # Se seteará antes de parsear
    
    # ✅ Usar _normalize_zone heredado que ya consume BARRIOS_URL_MAP
    
    def build_url(self, zone: str, operation: str, property_type: str) -> str:
        """Construye URL para Zonaprop"""
        op_map = {
            "venta": "venta",
            "alquiler": "alquiler"
        }
        
        type_map = {
            "departamento": "departamentos",
            "casa": "casas",
            "ph": "ph",
            "terreno": "terrenos",
            "local": "locales",
            "oficina": "oficinas"
        }
        
        op = op_map.get(operation.lower(), "venta")
        p_type = type_map.get(property_type.lower(), "departamentos")
        
        # Zonaprop ahora usa preferentemente formato con guiones
        # departamentos-venta-villa-lugano.html
        z_norm = self._normalize_zone(zone)
        
        if z_norm:
            url = f"{self.base_url}/{p_type}-{op}-{z_norm}.html"
        else:
            url = f"{self.base_url}/{p_type}-{op}.html"
        
        return url
    
    def parse_properties(self, html: str, operation: str = "venta", property_type: str = "departamento") -> List[PropertyData]:
        """Parsea propiedades de Zonaprop"""
        properties = []
        
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            
            # Selectores para Zonaprop
            # Las tarjetas ahora tienen data-qa="posting PROPERTY"
            cards = soup.select('[data-qa*="posting"], div[class*="posting-card"], div[data-id]')
            
            if not cards:
                cards = soup.select('.postingsList-module__card-container > div')
            
            for card in cards:
                try:
                    prop = self._parse_card(card, operation, property_type)
                    if prop:
                        properties.append(prop)
                except Exception as e:
                    logger.debug(f"Error parseando tarjeta: {e}")
                    continue
            
            logger.info(f"[Zonaprop] Extraídas {len(properties)} propiedades")
            
        except ImportError:
            logger.error("BeautifulSoup no instalado")
        except Exception as e:
            logger.error(f"[Zonaprop] Error parseando: {e}")
        
        return properties
    
    def _parse_card(self, card, operation: str = "venta", property_type: str = "departamento") -> Optional[PropertyData]:
        """Parsea una tarjeta individual de Zonaprop"""
        try:
            # Extraer precio
            price_elem = card.select_one('[data-qa="POSTING_CARD_PRICE"], .postingPrices-module__price, .price')
            price_text = price_elem.get_text(strip=True) if price_elem else ""
            price, currency = self._clean_price(price_text)
            
            if price == 0:
                # Intentar buscar en otros formatos de precio
                price_elem = card.select_one('[class*="price"]')
                if price_elem:
                    price, currency = self._clean_price(price_elem.get_text())
                
                if price == 0:
                    return None
            
            # Extraer dirección y ubicación
            addr_elem = card.select_one('.postingLocations-module__location-address, .address')
            loc_elem = card.select_one('[data-qa="POSTING_CARD_LOCATION"], .location')
            
            address = addr_elem.get_text(strip=True) if addr_elem else ""
            location = loc_elem.get_text(strip=True) if loc_elem else ""
            
            if not address and location:
                address = location
            
            if not location and address:
                location = address
            
            # ========================================
            # EXTRAER BARRIO DE LA DIRECCIÓN/UBICACIÓN
            # ========================================
            barrio = self.target_zone # Prevenir fallos con ubicaciones incompletas
            if location:
                partes_loc = [p.strip().lower() for p in location.split(',')]
                # Buscar el barrio en las partes (usualmente la primera o segunda)
                for parte in partes_loc:
                    if parte in [self.target_zone.lower(), "capital federal", "caba"]:
                        if parte != "capital federal" and parte != "caba":
                            barrio = parte
                            break
            elif address:
                partes_dir = [p.strip().lower() for p in address.split(',')]
                for parte in partes_dir:
                    if self.target_zone.lower() in parte:
                        barrio = self.target_zone.lower()
                        break
            
            # Extraer URL
            link_elem = card.select_one('a[href], [data-to-posting]')
            url = ""
            if link_elem:
                if link_elem.has_attr('href'):
                    url = link_elem['href']
                elif link_elem.has_attr('data-to-posting'):
                    url = link_elem['data-to-posting']
            
            if url and not url.startswith('http'):
                url = f"{self.base_url}{url}"

            # Extraer título / descripción
            title_elem = card.select_one('[data-qa="POSTING_CARD_DESCRIPTION"], .postingCard-module__posting-description, h2')
            title = title_elem.get_text(strip=True) if title_elem else address
            
            # Si el título agarró un precio, intentar sacarlo de la URL o el body
            if title and (title.startswith('$') or 'USD' in title.upper() or 'U$S' in title.upper() or title.replace('.','').isdigit()):
                if url:
                    try:
                        slug = url.split('/')[-1].split('?')[0].replace('.html', '').split('-')
                        words = [w.capitalize() for w in slug if not w.isdigit()]
                        if len(words) > 2:
                            if len(words[0]) > 5 and not any(v in words[0].lower() for v in ['a','e','i','o','u']):
                                words = words[1:]
                            title = " ".join(words).replace('Clasificado ', '')
                    except:
                        pass
                if title.startswith('$') or not title:
                    title = address

            # Extraer superficie y características (mejorado para Zonaprop actual)
            features_elem = card.select_one('[data-qa="POSTING_CARD_FEATURES"], .postingMainFeatures-module__posting-main-features-block, [class*="features"]')
            surface = 0
            if features_elem:
                features_text = features_elem.get_text(" ", strip=True)
                surface = self._clean_surface(features_text)
            
            # Si no se encontró superficie, buscar en otros elementos
            if surface == 0:
                features = card.select('[data-qa="POSTING_CARD_FEATURES"], .features, .posting-features li, [class*="feature"]')
                for feature in features:
                    text = feature.get_text(strip=True)
                    if 'm²' in text or 'm2' in text.lower():
                        surface = self._clean_surface(text)
                        if surface > 0: break
            
            # Si a pesar de todo no hay datos básicos, descartamos para no ensuciar estadísticas
            if not title and not address and surface == 0:
                logger.debug("[Zonaprop] Descartada tarjeta vacía (posible esqueleto)")
                return None
            
            # Extraer ID externo
            prop_id = ""
            if card.has_attr('data-id'):
                prop_id = card['data-id']
            elif card.has_attr('id'):
                prop_id = card['id']
            
            # Calcular precio por m2
            price_m2 = self._calculate_price_per_m2(price, surface, currency)
            
            return PropertyData(
                source=self.source_name,
                external_id=prop_id or (url.split('/')[-1].replace('.html', '') if url else ""),
                title=title,
                price_amount=price,
                price_currency=currency,
                price_per_m2=price_m2,
                surface_total=surface,
                surface_covered=surface,
                location=barrio,  # ← Guardar el barrio extraído
                address=address,
                property_type=property_type,
                operation_type=operation,
                url=url
            )
            
        except Exception as e:
            logger.debug(f"Error en _parse_card: {e}")
            return None

# ========================================
# SCRAPER DE MERCADOLIBRE
# ========================================

class MercadoLibreScraper(BaseScraper):
    """Scraper específico para MercadoLibre Inmuebles"""
    
    def __init__(self):
        super().__init__("https://inmuebles.mercadolibre.com.ar", "mercadolibre")
        self.target_zone = ""
        # Headers específicos para ML
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
            "Sec-Ch-Ua": '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
        })
    
    def build_url(self, zone: str, operation: str, property_type: str) -> str:
        """Construye URL para MercadoLibre Inmuebles"""
        op_map = {"venta": "venta", "alquiler": "alquiler"}
        type_map = {
            "departamento": "departamentos", "casa": "casas", "ph": "ph",
            "terreno": "terrenos", "local": "locales-comerciales",
            "oficina": "oficinas", "cochera": "cocheras", "deposito": "depositos-galpones"
        }
        
        op = op_map.get(operation.lower(), "venta")
        p_type = type_map.get(property_type.lower(), "departamentos")
        
        # ✅ MEJORADO: Usar mapeo específico de ML si existe, fallback a URL_MAP
        try:
            from .constants import BARRIOS_URL_MAP, BARRIOS_ML_MAP
        except:
            try: from constants import BARRIOS_URL_MAP, BARRIOS_ML_MAP
            except: 
                BARRIOS_URL_MAP = {}; BARRIOS_ML_MAP = {}
        
        # Prioridad 1: Mapeo exacto de ML
        # Prioridad 2: Mapeo general de URLS
        # Prioridad 3: Slug simple
        path = BARRIOS_ML_MAP.get(zone.lower()) or BARRIOS_URL_MAP.get(zone.lower()) or zone.lower().replace(' ', '-')
        
        # Si el path ya es absoluto (tiene slashes), lo usamos tal cual
        # Si no, lo concatenamos al formato estándar
        if '/' in path:
            url = f"{self.base_url}/{p_type}/{op}/{path}/"
        else:
            url = f"{self.base_url}/{p_type}/{op}/{path}/"
            
        return url
    
    def parse_properties(self, html: str, operation: str = "venta", property_type: str = "departamento") -> List[PropertyData]:
        """Parsea propiedades de MercadoLibre"""
        properties = []
        
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            
            # Selectores para MercadoLibre Inmuebles
            cards = soup.select('li.ui-search-layout__item')
            
            if not cards:
                ol_layout = soup.select_one('ol.ui-search-layout')
                if ol_layout:
                    cards = ol_layout.select('li')
            
            if not cards:
                cards = soup.select('article.ui-search-result')
            
            if not cards:
                cards = soup.select('div.ui-search-result__item')
            
            if not cards:
                cards = soup.select('.poly-card, .poly-component__card, [data-qa="listing-item"]')
            
            if not cards:
                ml_items = soup.select('a[href*="/ML"]')
                for item in ml_items[:50]:
                    card = item.find_parent(['li', 'div', 'article'], limit=5)
                    if card and card not in cards:
                        cards.append(card)
            
            logger.info(f"[MercadoLibre] Encontradas {len(cards)} tarjetas candidatas")
            
            for card in cards:
                try:
                    prop = self._parse_card(card, operation, property_type)
                    if prop and prop.price_amount > 0:
                        properties.append(prop)
                except Exception as e:
                    logger.debug(f"Error parseando tarjeta ML: {e}")
                    continue
            
            logger.info(f"[MercadoLibre] Extraídas {len(properties)} propiedades válidas")
            
        except ImportError:
            logger.error("BeautifulSoup no instalado. Instalar: pip install beautifulsoup4")
        except Exception as e:
            logger.error(f"[MercadoLibre] Error parseando: {e}")
        
        return properties
    
    def _parse_card(self, card, operation: str = "venta", property_type: str = "departamento") -> Optional[PropertyData]:
        """Parsea una tarjeta individual de MercadoLibre"""
        try:
            # Extraer precio
            price_text = ""
            price = 0.0
            currency = "ARS"
            
            # Estrategia 1: poly-component__price con andes-money-amount
            price_elem = card.select_one('.poly-component__price')
            if price_elem:
                symbol_elem = price_elem.select_one('.andes-money-amount__currency-symbol')
                fraction_elem = price_elem.select_one('.andes-money-amount__fraction')
                
                if symbol_elem and fraction_elem:
                    symbol = symbol_elem.get_text(strip=True)
                    fraction = fraction_elem.get_text(strip=True)
                    price_text = f"{symbol} {fraction}"
                else:
                    price_text = price_elem.get_text(strip=True)
            
            # Estrategia 2: Buscar cualquier andes-money-amount
            if not price_text:
                money_elem = card.select_one('.andes-money-amount')
                if money_elem:
                    symbol_elem = money_elem.select_one('.andes-money-amount__currency-symbol')
                    fraction_elem = money_elem.select_one('.andes-money-amount__fraction')
                    
                    if symbol_elem and fraction_elem:
                        symbol = symbol_elem.get_text(strip=True)
                        fraction = fraction_elem.get_text(strip=True)
                        price_text = f"{symbol} {fraction}"
            
            # Estrategia 3: ui-search-price (estructura vieja)
            if not price_text:
                price_elem = card.select_one('.ui-search-price__part--medium')
                if price_elem:
                    price_text = price_elem.get_text(strip=True)
            
            price, currency = self._clean_price(price_text)
            
            # Extraer título
            title = ""
            
            title_elem = card.select_one('.poly-component__title a')
            if title_elem:
                title = title_elem.get_text(strip=True)
            
            if not title:
                img_elem = card.select_one('.poly-component__picture')
                if img_elem and img_elem.has_attr('alt'):
                    title = img_elem['alt']
            
            if not title:
                title_elem = card.select_one('.ui-search-item__title')
                if title_elem:
                    title = title_elem.get_text(strip=True)
            
            # Extraer URL
            url = ""
            link_elem = card.select_one('.poly-component__title a')
            if link_elem and link_elem.has_attr('href'):
                url = link_elem['href']
            else:
                link_elem = card.select_one('a[href*="/ML"]')
                if link_elem:
                    url = link_elem['href']
            
            # ========================================
            # EXTRAER UBICACIÓN Y BARRIO
            # ========================================
            address = ""
            barrio = ""
            
            location_elem = card.select_one('.poly-component__location')
            if location_elem:
                address = location_elem.get_text(strip=True)
                # MercadoLibre formato: "Dirección, Barrio, Ciudad"
                partes = address.split(',')
                if len(partes) >= 2:
                    barrio = partes[1].strip().lower()
                else:
                    barrio = address.strip().lower()
            
            if not address:
                location_elem = card.select_one('.ui-search-item__location')
                if location_elem:
                    address = location_elem.get_text(strip=True)
                    partes = address.split(',')
                    if len(partes) >= 2:
                        barrio = partes[1].strip().lower()
                    else:
                        barrio = address.strip().lower()
            
            # Extraer superficie
            surface = 0.0
            rooms = None
            
            # Estrategia 1: Buscar en poly-component__card
            card_content = card.select_one('.poly-component__card, .poly-card')
            if card_content:
                all_text = card_content.get_text(strip=True)
                surface_patterns = re.findall(r'(\d{1,4})\s*(?:m²|m2|mts2|mts²)', all_text, re.IGNORECASE)
                if surface_patterns:
                    surface = float(surface_patterns[0])
            
            # Estrategia 2: Buscar en contenedores de atributos
            if surface == 0:
                attrs_containers = card.select('.poly-card__attributes, .poly-component__attributes, .poly-card__card, .ui-search-result-attributes, .ui-search-card-attributes')
                for attrs_container in attrs_containers:
                    attr_items = attrs_container.select('li, span, div')
                    for attr in attr_items:
                        text = attr.get_text(strip=True)
                        if 'm²' in text or 'm2' in text.lower():
                            surface = self._clean_surface(text)
                            if surface > 0:
                                break
                        elif 'dorm' in text.lower() or 'ambiente' in text.lower():
                            room_nums = re.findall(r'\d+', text)
                            if room_nums:
                                rooms = int(room_nums[0])
                    if surface > 0:
                        break
            
            # Estrategia 3: Buscar en el título
            if surface == 0 and title:
                surface_patterns = re.findall(r'(\d{1,4})\s*(?:m²|m2|mts2|mts²)', title, re.IGNORECASE)
                if surface_patterns:
                    surface = float(surface_patterns[0])
            
            # Calcular precio por m2
            price_m2 = self._calculate_price_per_m2(price, surface, currency)
            
            # Extraer ID externo de la URL
            prop_id = ""
            if url:
                id_match = re.search(r'/ML[A-Z]?-?\d+', url)
                if id_match:
                    prop_id = id_match.group(0).replace('/', '')
                else:
                    prop_id = url.split('/')[-1].replace('.html', '').replace('_JM', '')
            
            # Extraer thumbnail
            thumbnail = ""
            img_elem = card.select_one('.poly-component__picture')
            if img_elem:
                if img_elem.has_attr('src'):
                    thumbnail = img_elem['src']
                elif img_elem.has_attr('data-src'):
                    thumbnail = img_elem['data-src']
            
            return PropertyData(
                source=self.source_name,
                external_id=prop_id or url.split('/')[-1] if url else "",
                title=title if title else "Sin título",
                price_amount=price,
                price_currency=currency,
                price_per_m2=price_m2,
                surface_total=surface,
                surface_covered=surface,
                location=barrio,  # ← Guardar el barrio extraído
                address=address,
                property_type=property_type,
                operation_type=operation,
                url=url,
                raw_data={"thumbnail": thumbnail} if thumbnail else {}
            )
            
        except Exception as e:
            logger.debug(f"Error en _parse_card ML: {e}")
            return None

    
    
# ========================================
# ANALIZADOR DE MERCADO
# ========================================

class MarketAnalyzer:
    """Analiza datos del mercado inmobiliario"""
    
    # Umbral mínimo de superficie (en m²) para estadísticas válidas
    MIN_SURFACE_THRESHOLD = 10
    

  
    @staticmethod
    def _remove_outliers(data_list: List[float]) -> List[float]:
        """Elimina valores atípicos usando el Rango Intercuartílico (IQR) y límites absolutos"""
        if not data_list:
            return []
            
        # 1. Filtro básico absoluto para eliminar precios de $1 o similares (errores de carga)
        # Para USD, menos de 5000 es sospechoso para venta. 
        # Pero esta función se usa para m2 y total, así que mejor usar algo relativo o IQR.
        
        if len(data_list) < 3:
            return data_list
            
        data_sorted = sorted(data_list)
        n = len(data_sorted)
        
        # Usar percentiles para mayor estabilidad en muestras pequeñas
        q1 = data_sorted[int(n * 0.25)]
        q3 = data_sorted[int(n * 0.75)]
        iqr = q3 - q1
        
        # Ser más estricto con los outliers (1.5 * IQR es estándar)
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        # Asegurar que lower_bound no sea menor que un mínimo razonable (ej. 10% de la mediana)
        from statistics import median
        med = median(data_sorted)
        lower_bound = max(lower_bound, med * 0.1)
        upper_bound = min(upper_bound, med * 10.0) # Evitar errores de coma (1.000.000 -> 100.000.000)
        
        return [x for x in data_list if lower_bound <= x <= upper_bound]

    @staticmethod
    def _normalize_text(text: str) -> str:
        """Elimina acentos y normaliza texto para comparaciones"""
        if not text: return ""
        import unicodedata
        text = text.lower().strip()
        return "".join(
            c for c in unicodedata.normalize('NFD', text)
            if unicodedata.category(c) != 'Mn'
        )

    @staticmethod
    def _is_in_zone(prop_location: str, prop_address: str, zone: str) -> bool:
        """Determina si una propiedad está en la zona buscada (flexibilizado y sin acentos)"""
        if not zone:
            return True

        zone_norm = MarketAnalyzer._normalize_text(zone)
        # Combinar ubicación y dirección para tener contexto completo
        text_norm = MarketAnalyzer._normalize_text(f"{prop_location or ''} {prop_address or ''}")

        # ========================================
        # ❌ EXCLUSIONES ESPECÍFICAS DE ZONA
        # ========================================
        # Evitar que "Belgrano" coincida con "General Belgrano" o "Villa General Belgrano"
        if zone_norm == "belgrano":
            for excl in ["general belgrano", "manuel belgrano", "m. belgrano"]:
                if excl in text_norm:
                    # Solo excluir si NO aparece "capital federal" o "caba" para confirmar que es el barrio de CABA
                    if not any(x in text_norm for x in ["capital federal", "caba", "buenos aires c.f."]):
                        return False

        # ========================================
        # ❌ EXCLUSIONES DE PATRONES DE CALLE
        # ========================================
        # Si el nombre del barrio aparece SOLO como nombre de calle (ej: "Avenida Belgrano 1234")
        # y no hay otra mención del barrio como ubicación.
        street_patterns = [
            rf"avenida\s+{re.escape(zone_norm)}\s+\d+", 
            rf"av\.?\s+{re.escape(zone_norm)}\s+\d+",
            rf"calle\s+{re.escape(zone_norm)}\s+\d+",
        ]
        
        is_street_name = False
        for pattern in street_patterns:
            if re.search(pattern, text_norm):
                is_street_name = True
                break
        
        # Si aparece como calle, verificamos si aparece en otra parte del texto (como barrio)
        if is_street_name:
            # Contar ocurrencias del nombre de la zona
            count = len(re.findall(rf"\b{re.escape(zone_norm)}\b", text_norm))
            # Si solo aparece una vez, y es el patrón de calle, probablemente no es el barrio
            if count <= 1:
                # Excepción: si el texto explícitamente dice "en [Barrio]" o similar
                if not any(f"en {zone_norm}" in text_norm for zone_norm in [zone_norm]):
                    return False

        # ========================================
        # ✅ MATCH DE ZONA CON LÍMITES DE PALABRA
        # ========================================
        if re.search(rf"\b{re.escape(zone_norm)}\b", text_norm):
            # Excluir otras provincias si no se menciona CABA y no es la zona buscada
            provincias = ["cordoba", "mendoza", "santa fe", "neuquen", "chubut", "misiones"]
            if any(p in text_norm for p in provincias):
                # Si menciona otra provincia y NO menciona Capital Federal, desconfiar
                if not any(x in text_norm for x in ["capital federal", "caba", "c.f."]):
                    return False
            return True

        return False

    @staticmethod
    def calculate_stats(properties: List[PropertyData], zone: str, operation: str, prop_type: str) -> MarketStats:
        """Calcula estadísticas del mercado inmobiliario con normalización y limpieza de outliers"""
        global USD_RATE
        errors = []
        source_breakdown = {}
        currency_dist = {}
        properties_list = []
        low_surface_count = 0 
        
        if not properties:
            return MarketStats(
                zone=zone, operation_type=operation, property_type=prop_type,
                sample_size=0, average_price_per_m2=None, average_total_price=None,
                median_price_per_m2=None, min_price_per_m2=None, max_price_per_m2=None,
                price_range_total=None, currency_distribution={}, source_breakdown={},
                properties=[], errors=["No se pudieron obtener datos del mercado"],
                usd_rate=USD_RATE
            )
        
        # 1. Determinar Moneda Base para el análisis estadístico
        # Ventas y Terrenos -> USD. Alquileres (excepto terrenos) -> ARS.
        is_terrain = prop_type.lower() in ["terreno", "terrenos"]
        is_sale = operation.lower() == "venta"
        base_currency = "USD" if (is_terrain or is_sale) else "ARS"
        
        normalized_total_prices = []
        normalized_m2_prices = []
        
        for prop in properties:
            # 1. Filtro de Zona
            if not MarketAnalyzer._is_in_zone(prop.location, prop.address, zone):
                continue
                
            # 2. Contabilizar metadatos originales
            source_breakdown[prop.source] = source_breakdown.get(prop.source, 0) + 1
            currency_dist[prop.price_currency] = currency_dist.get(prop.price_currency, 0) + 1
            
            # 3. Normalización a Moneda Base
            price_norm = prop.price_amount
            m2_norm = prop.price_per_m2
            
            if base_currency == "USD" and prop.price_currency == "ARS":
                price_norm /= USD_RATE
                m2_norm /= USD_RATE
            elif base_currency == "ARS" and prop.price_currency == "USD":
                price_norm *= USD_RATE
                m2_norm *= USD_RATE
            
            # 4. Validaciones de Superficie/Precio
            has_valid_price = price_norm > 0
            has_valid_surface = prop.surface_total >= MarketAnalyzer.MIN_SURFACE_THRESHOLD
            
            # --- FILTRO DE SEGURIDAD CRÍTICO PARA ALQUILERES ---
            # Si es alquiler, un precio > 10.000.000 ARS es probablemente un error de carga 
            # o una venta mal categorizada (ej. 80.000 USD convertido a ARS)
            if operation == "alquiler":
                price_ars = price_norm if base_currency == "ARS" else price_norm * USD_RATE
                if price_ars > 10_000_000:
                    continue # Ignorar esta propiedad para promedios
            
            if not has_valid_surface:
                low_surface_count += 1
            
            # Incluir para estadísticas de precio total si el precio es válido
            if has_valid_price:
                normalized_total_prices.append(price_norm)
                
                # Incluir para estadísticas de m2 solo si el precio Y la superficie son válidos
                if has_valid_surface and m2_norm > 0:
                    normalized_m2_prices.append(m2_norm)
            
            # Guardar en lista detallada (originales)
            properties_list.append({
                "source": prop.source, "title": prop.title, "price": prop.price_amount,
                "currency": prop.price_currency, "price_m2": prop.price_per_m2,
                "surface": prop.surface_total, "address": prop.address, "url": prop.url,
                "operation_type": prop.operation_type, "property_type": prop.property_type,
                "surface_warning": not has_valid_surface
            })
        
        # 5. FILTRO DE OUTLIERS (IQR)
        # Esto elimina precios absurdos de portales (ej: alquileres de $250M)
        clean_total_prices = MarketAnalyzer._remove_outliers(normalized_total_prices)
        clean_m2_prices = MarketAnalyzer._remove_outliers(normalized_m2_prices)
        
        outliers_count = len(normalized_total_prices) - len(clean_total_prices)
        
        # 6. Cálculos Finales
        from statistics import mean, median
        
        avg_total = mean(clean_total_prices) if clean_total_prices else None
        med_total = median(clean_total_prices) if clean_total_prices else None
        avg_m2 = mean(clean_m2_prices) if clean_m2_prices else None
        med_m2 = median(clean_m2_prices) if clean_m2_prices else None
        min_m2 = min(clean_m2_prices) if clean_m2_prices else None
        max_m2 = max(clean_m2_prices) if clean_m2_prices else None
        
        price_range = None
        if clean_total_prices:
            price_range = f"{min(clean_total_prices):,.0f} - {max(clean_total_prices):,.0f}"
        
        # Notificar filtros aplicados en los errores/warnings
        warnings = []
        if low_surface_count > 0:
            warnings.append(f"{low_surface_count} propiedades con sup. < {MarketAnalyzer.MIN_SURFACE_THRESHOLD}m² excluidas")
        if outliers_count > 0:
            warnings.append(f"{outliers_count} valores atípicos (outliers) descartados")
        
        return MarketStats(
            zone=zone, operation_type=operation, property_type=prop_type,
            sample_size=len(clean_total_prices), # Reportar muestra REAL utilizada
            average_price_per_m2=avg_m2, 
            average_total_price=avg_total,
            median_total_price=med_total,
            median_price_per_m2=med_m2, 
            min_price_per_m2=min_m2, 
            max_price_per_m2=max_m2,
            price_range_total=price_range, currency_distribution=currency_dist,
            source_breakdown=source_breakdown, properties=properties_list,
            errors=warnings if warnings else errors,
            usd_rate=USD_RATE
        )
    
    @staticmethod
    def to_dict(stats: MarketStats) -> Dict:
        """Convierte MarketStats a diccionario para JSON"""
        return {
            "zone": stats.zone,
            "operation_type": stats.operation_type,
            "property_type": stats.property_type,
            "sample_size": stats.sample_size,
            "statistics": {
                "average_price_per_m2": round(stats.average_price_per_m2, 2) if stats.average_price_per_m2 else None,
                "average_total_price": round(stats.average_total_price, 2) if stats.average_total_price else None,
                "median_total_price": round(stats.median_total_price, 2) if stats.median_total_price else None,
                "median_price_per_m2": round(stats.median_price_per_m2, 2) if stats.median_price_per_m2 else None,
                "min_price_per_m2": round(stats.min_price_per_m2, 2) if stats.min_price_per_m2 else None,
                "max_price_per_m2": round(stats.max_price_per_m2, 2) if stats.max_price_per_m2 else None,
                "price_range_total": stats.price_range_total,
                "usd_rate_used": stats.usd_rate
            },
            "currency_distribution": stats.currency_distribution,
            "source_breakdown": stats.source_breakdown,
            "properties_sample": stats.properties,  # Primeros 50
            "total_properties_analyzed": len(stats.properties),
            "analysis_timestamp": datetime.now().isoformat(),
            "errors": stats.errors
        }

    

   

# ========================================
# SCRAPER DE ARGENPROP
# ========================================

class ArgenpropScraper(BaseScraper):
    """Scraper específico para Argenprop"""
    
    def __init__(self):
        super().__init__("https://www.argenprop.com", "argenprop")
        self.target_zone = ""  # Se seteará antes de parsear
    
    def _normalize_zone(self, zone: str) -> str:
        """Normaliza el nombre de la zona para la URL"""
        normalized = zone.lower().strip()
        normalized = normalized.replace(' ', '-')
        replacements = {
            'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
            'ñ': 'n', 'ü': 'u'
        }
        for acc, plain in replacements.items():
            normalized = normalized.replace(acc, plain)
        return normalized
    
    def build_url(self, zone: str, operation: str, property_type: str) -> str:
        """Construye URL para Argenprop"""
        op_map = {
            "venta": "venta",
            "alquiler": "alquiler"
        }
        
        type_map = {
            "departamento": "departamentos",
            "casa": "casas",
            "ph": "ph",
            "terreno": "terrenos",
            "local": "locales-comerciales",
            "oficina": "oficinas",
            "cochera": "cocheras",
            "deposito": "depositos-galpones"
        }
        
        op = op_map.get(operation.lower(), "venta")
        p_type = type_map.get(property_type.lower(), "departamentos")
        
        z_norm = self._normalize_zone(zone)
        
        if z_norm:
            url = f"{self.base_url}/{p_type}/{op}/{z_norm}"
        else:
            url = f"{self.base_url}/{p_type}/{op}"
        
        return url
    
    def parse_properties(self, html: str, operation: str = "venta", property_type: str = "departamento") -> List[PropertyData]:
        """Parsea propiedades de Argenprop"""
        properties = []
        
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            
            cards = soup.select('div.listing__item, div.card, div[data-qa="posting"]')
            
            if not cards:
                cards = soup.select('articleposting-card, divposting')
            
            for card in cards:
                try:
                    prop = self._parse_card(card, operation, property_type)
                    if prop:
                        properties.append(prop)
                except Exception as e:
                    logger.debug(f"Error parseando tarjeta: {e}")
                    continue
            
            logger.info(f"[Argenprop] Extraídas {len(properties)} propiedades")
            
        except ImportError:
            logger.error("BeautifulSoup no instalado. Instalar: pip install beautifulsoup4")
        except Exception as e:
            logger.error(f"[Argenprop] Error parseando: {e}")
        
        return properties
    
    def _parse_card(self, card, operation: str = "venta", property_type: str = "departamento") -> Optional[PropertyData]:
        """Parsea una tarjeta individual de Argenprop"""
        try:
            # Extraer precio
            price_elem = card.select_one('.card__price, [data-qa="card-price"], .price')
            price_text = ""
            if price_elem:
                currency_span = price_elem.select_one('.card__currency')
                if currency_span:
                    currency_text = currency_span.get_text(strip=True)
                    temp_price = price_elem.get_text(strip=True).replace(currency_text, "").strip()
                    price_text = f"{currency_text} {temp_price}"
                else:
                    price_text = price_elem.get_text(strip=True)
            
            price, currency = self._clean_price(price_text)
            
            if price == 0:
                return None
            
            # Extraer dirección
            addr_elem = card.select_one('.card__address, [data-qa="card-address"], .address')
            address = addr_elem.get_text(strip=True) if addr_elem else ""
            
            # ========================================
            # EXTRAER BARRIO DE LA DIRECCIÓN
            # ========================================
            barrio = self.target_zone
            if address:
                partes = [p.strip().lower() for p in address.split(',')]
                for parte in partes:
                    if self.target_zone.lower() in parte:
                        barrio = self.target_zone.lower()
                        break
            
            # Extraer título
            title_elem = card.select_one('.card__title, h2, h3, [data-qa="card-title"]')
            title = title_elem.get_text(strip=True) if title_elem else address
            
            # Extraer superficie
            surface_elem = card.select_one('.card__main-features, [data-qa="card-features"]')
            surface_text = surface_elem.get_text(strip=True) if surface_elem else ""
            surface = self._clean_surface(surface_text)
            
            # Calcular precio por m2
            price_m2 = self._calculate_price_per_m2(price, surface, currency)
            
            # Extraer URL
            link_elem = card.select_one('a[href]')
            url = link_elem['href'] if link_elem and link_elem.has_attr('href') else ""
            if url and not url.startswith('http'):
                url = f"{self.base_url}{url}"
            
            # Extraer ID externo
            prop_id = ""
            if card.has_attr('data-id'):
                prop_id = card['data-id']
            elif card.has_attr('id'):
                prop_id = card['id']
            
            return PropertyData(
                source=self.source_name,
                external_id=prop_id or url.split('/')[-1] if url else "",
                title=title,
                price_amount=price,
                price_currency=currency,
                price_per_m2=price_m2,
                surface_total=surface,
                surface_covered=surface,
                location=barrio,  # ← Guardar el barrio extraído
                address=address,
                property_type=property_type,
                operation_type=operation,
                url=url
            )
            
        except Exception as e:
            logger.debug(f"Error en _parse_card: {e}")
            return None




    
# ========================================
# GESTOR DE SCRAPING
# ========================================

class ScrapingManager:
    """Gestiona el scraping de múltiples portales"""
    
    def __init__(self):
        self.argenprop = ArgenpropScraper()
        self.zonaprop = ZonapropScraper()
        self.mercadolibre = MercadoLibreScraper()
        self.analyzer = MarketAnalyzer()
    
    def _filter_by_exact_barrio(self, properties, target_barrio):
        """Filtra propiedades usando constantes centralizadas con soporte GBA y tildes"""
        try:
            from .constants import UBICACIONES_EXCLUIDAS
        except:
            try: from constants import UBICACIONES_EXCLUIDAS
            except: UBICACIONES_EXCLUIDAS = []
        
        filtered = []
        target_norm = MarketAnalyzer._normalize_text(target_barrio)
        
        for prop in properties:
            location_norm = MarketAnalyzer._normalize_text(prop.location)
            address_norm = MarketAnalyzer._normalize_text(prop.address)
            text_context = f"{location_norm} {address_norm}"
            
            # ❌ Excluir ubicaciones negras (normalizadas)
            if any(MarketAnalyzer._normalize_text(excl) in text_context for excl in UBICACIONES_EXCLUIDAS):
                continue
            
            # ✅ Validar pertenencia a zona
            if re.search(rf"\b{re.escape(target_norm)}\b", text_context):
                filtered.append(prop)
            else:
                logger.debug(f"Filtrado por barrio: {prop.title[:30]}... ({prop.location})")
        
        print(f"📌 Filtro exacto ({target_barrio}): {len(properties)} → {len(filtered)} propiedades")
        return filtered
    
    def _deduplicate_properties(self, properties):
        """Elimina propiedades duplicadas basado en URL y huella digital (Precio + Superficie)"""
        seen_urls = {}
        seen_fingerprints = {}
        unique = []
        
        for prop in properties:
            # 1. Deduplicación por URL (mismo portal)
            url_key = prop.url if prop.url else f"{prop.source}_{prop.external_id}"
            if url_key in seen_urls:
                continue
                
            # 2. Deduplicación por Huella Digital (diferentes portales suelen tener mismos datos)
            # Combinamos precio, superficie (redondeada) y barrio para detectar duplicados cruzados
            price_key = round(prop.price_amount / 100) * 100 # Redondear a cientos
            surface_key = round(prop.surface_total)
            
            # Solo aplicar huella digital si tenemos datos sólidos
            if price_key > 0 and surface_key > 10:
                fingerprint = f"{prop.operation_type}_{price_key}_{surface_key}_{prop.location.lower()[:10]}"
                if fingerprint in seen_fingerprints:
                    # Si ya lo vimos con estos datos, probablemente es duplicado
                    # Pero solo lo descartamos si la fuente es diferente para no perder datos
                    if seen_fingerprints[fingerprint] != prop.source:
                        continue
                else:
                    seen_fingerprints[fingerprint] = prop.source
            
            seen_urls[url_key] = True
            unique.append(prop)
        
        print(f"🔄 Eliminados {len(properties) - len(unique)} duplicados (URL y Huella)")
        return unique
    
    def scrape_market(self, zone: str, operation: str = "venta", 
                      property_type: str = "departamento") -> Dict[str, Any]:
        """
        Realiza scraping de mercado inmobiliario en paralelo para mayor velocidad.
        """
        import concurrent.futures
        
        # Normalizar barrio para la búsqueda
        search_zone = zone
        if "lugano" in zone.lower() and "villa" not in zone.lower():
            search_zone = "villa lugano"
            
        logger.info(f"[ScrapingManager] Iniciando scraping PARALELO para {search_zone} ({operation}, {property_type})")
        
        all_properties = []
        errors = []
        
        # Definir las tareas de scraping
        def get_argenprop():
            try:
                self.argenprop.target_zone = search_zone
                url = self.argenprop.build_url(search_zone, operation, property_type)
                logger.info(f"[Argenprop] URL: {url}")
                html = self.argenprop._render_with_selenium(url)
                if not html: html = self.argenprop._make_request(url)
                return self.argenprop.parse_properties(html, operation, property_type) if html else []
            except Exception as e:
                errors.append(f"Argenprop: {str(e)}")
                return []

        def get_zonaprop():
            try:
                self.zonaprop.target_zone = search_zone
                url = self.zonaprop.build_url(search_zone, operation, property_type)
                logger.info(f"[Zonaprop] URL: {url}")
                html = self.zonaprop._render_with_selenium(url)
                if not html: html = self.zonaprop._make_request(url)
                return self.zonaprop.parse_properties(html, operation, property_type) if html else []
            except Exception as e:
                errors.append(f"Zonaprop: {str(e)}")
                return []

        def get_mercadolibre():
            try:
                self.mercadolibre.target_zone = search_zone
                url = self.mercadolibre.build_url(search_zone, operation, property_type)
                logger.info(f"[MercadoLibre] URL: {url}")
                # ML suele funcionar bien sin Selenium, probamos request directo primero para velocidad
                html = self.mercadolibre._make_request(url)
                if not html: html = self.mercadolibre._render_with_selenium(url)
                return self.mercadolibre.parse_properties(html, operation, property_type) if html else []
            except Exception as e:
                errors.append(f"MercadoLibre: {str(e)}")
                return []

        # Ejecutar en paralelo
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_to_portal = {
                executor.submit(get_argenprop): "Argenprop",
                executor.submit(get_zonaprop): "Zonaprop",
                executor.submit(get_mercadolibre): "MercadoLibre"
            }
            for future in concurrent.futures.as_completed(future_to_portal):
                portal = future_to_portal[future]
                try:
                    props = future.result()
                    all_properties.extend(props)
                    logger.info(f"[ScrapingManager] {portal} completado ({len(props)} prop)")
                except Exception as e:
                    logger.error(f"[ScrapingManager] Error en {portal}: {e}")

        # Calcular estadísticas
        if not all_properties:
            return self.analyzer.calculate_stats([], zone, operation, property_type).__dict__

        print("ANTES DEDUP:", len(all_properties))
        all_properties = self._deduplicate_properties(all_properties)
        print("DESPUÉS DEDUP:", len(all_properties))
        all_properties = self._filter_by_exact_barrio(all_properties, zone)
        print(f"DESPUÉS FILTRO EXACTO: {len(all_properties)}")
        
        # Calcular estadísticas finales
        stats = self.analyzer.calculate_stats(all_properties, zone, operation, property_type)
        result = MarketAnalyzer.to_dict(stats)
        result['errors'].extend(errors)
        
        # Guardar conteo total de crudos para el mensaje
        result['raw_properties_count'] = len(all_properties)
        
        return result
        

    
    
    
# ========================================
# INTEGRACIÓN CON MAIN-AI
# ========================================

def integrate_with_main_ai(app, gemini_client_func=None):
    """
    Integra el scraper con la aplicación FastAPI existente
    
    Args:
        app: Instancia de FastAPI
        gemini_client_func: Función opcional para análisis con IA
    """
    from fastapi import Query
    
    scraping_manager = ScrapingManager()
    
    @app.get("/market/scraping")
    def scrape_market_data(
        zone: str = Query(..., description="Barrio o zona a analizar"),
        operation: str = Query("venta", description="Tipo de operación"),
        property_type: str = Query("departamento", description="Tipo de propiedad")
    ):
        """
        Endpoint para obtener datos de mercado mediante scraping
        
        Uso:
        - GET /market/scraping?zone=palermo
        - GET /market/scraping?zone=belgrano&operation=venta&property_type=casa
        """
        logger.info(f"📊 Solicitud de scraping: zone={zone}, op={operation}, type={property_type}")
        
        try:
            result = scraping_manager.scrape_market(zone, operation, property_type)
            
            if result.get('sample_size', 0) == 0:
                return {
                    "success": False,
                    "message": "No se pudieron obtener datos del mercado",
                    "zone": zone,
                    "errors": result.get('errors', [])
                }
            
            return {
                "success": True,
                "message": f"Analizadas {result['sample_size']} propiedades",
                "data": result
            }
            
        except Exception as e:
            logger.error(f"Error en scraping: {e}")
            return {
                "success": False,
                "error": str(e),
                "zone": zone
            }
    
    @app.get("/market/stats/{zone}")
    def get_market_stats(
        zone: str,
        operation: str = "venta",
        property_type: str = "departamento"
    ):
        """
        Obtiene estadísticas resumidas del mercado para una zona
        """
        try:
            result = scraping_manager.scrape_market(zone, operation, property_type)
            
            # Resumen condensado
            return {
                "zone": zone,
                "sample_size": result['sample_size'],
                "average_price_m2": result['statistics']['average_price_per_m2'],
                "median_price_m2": result['statistics']['median_price_per_m2'],
                "price_range": result['statistics']['price_range_total'],
                "sources": result['source_breakdown'],
                "currencies": result['currency_distribution']
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    logger.info("✅ Scraping endpoints integrados en FastAPI")


# ========================================
# EJECUCIÓN DIRECTA
# ========================================

if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Scraper de Mercado Inmobiliario")

    # 🔴 mismos nombres que usa tu backend
    parser.add_argument("--zona", required=True, help="Zona a analizar")
    parser.add_argument("--operacion", default="venta")
    parser.add_argument("--tipo", default="departamento")
    parser.add_argument("--output", default="scraping_data.json")

    args = parser.parse_args()

    manager = ScrapingManager()
    result = manager.scrape_market(args.zona, args.operacion, args.tipo)

    # ✅ AGREGAR ESTO (CLAVE)
    result["zone"] = args.zona
    result["operation"] = args.operacion

    # ✅ GUARDAR ARCHIVO (CLAVE)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✅ Resultado guardado en {args.output}")