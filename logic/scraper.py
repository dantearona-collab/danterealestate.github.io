"""
Módulo de Scraping y Análisis de Mercado Inmobiliario
Extrae datos de portales inmobiliarios argentinos y genera estadísticas de mercado
"""
import os
import sys
import json
import time
import random
import logging
import re
import requests
from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

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
    average_price_per_m2: Optional[float]
    average_total_price: Optional[float]
    median_price_per_m2: Optional[float]
    min_price_per_m2: Optional[float]
    max_price_per_m2: Optional[float]
    price_range_total: Optional[str]
    currency_distribution: Dict[str, int]
    source_breakdown: Dict[str, int]
    properties: List[Dict] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)

# ========================================
# CLASE BASE DEL SCRAPER
# ========================================

class BaseScraper(ABC):
    """Clase base para todos los scrapers de portales inmobiliarios"""
    
    def __init__(self, base_url: str, source_name: str):
        self.base_url = base_url
        self.source_name = source_name
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
    
    def _clean_price(self, price_text: str) -> tuple:
        """
        Limpia texto de precio y devuelve (amount, currency)
        Ej: "$ 150.000.000" -> (150000000.0, "ARS")
        """
        if not price_text:
            return 0.0, "ARS"
        
        price_text = price_text.strip().upper()
        
        # Detectar moneda
        currency = "ARS"
        if "USD" in price_text or "U$S" in price_text or "DÓLARES" in price_text:
            currency = "USD"
        
        # Extraer todos los grupos de dígitos
        all_numbers = re.findall(r'\d+', price_text)
        
        if not all_numbers:
            return 0.0, currency
        
        # Unir todos los grupos para buscar dentro del número completo
        full_number_str = ''.join(all_numbers)
        
        # Rango de precios inmobiliarios realistas
        if currency == "USD":
            # USD: 30,000 - 1,000,000 (5-7 dígitos)
            min_price = 30_000
            max_price = 1_000_000
        else:
            # ARS: 1,000,000 - 10,000,000,000 (7-11 dígitos)
            min_price = 1_000_000
            max_price = 10_000_000_000
        
        # Estrategia de búsqueda por ventana deslizante
        # Buscar un substring de 5-7 dígitos (USD) o 7-11 dígitos (ARS) que sea precio válido
        
        best_candidate = None
        
        if currency == "USD":
            # Para USD, buscar en ventanas de 6 dígitos
            window_size = 6
            for i in range(len(full_number_str) - window_size + 1):
                window = full_number_str[i:i+window_size]
                try:
                    value = int(window)
                    if min_price <= value <= max_price:
                        # Encontramos un precio válido, verificar que sea razonable
                        # Los precios no deben empezar con 0
                        if not window.startswith('0'):
                            best_candidate = value
                            break
                except ValueError:
                    continue
            
            # Si no encontramos con ventana de 6, probar con 5 o 7
            if not best_candidate:
                for size in [5, 7]:
                    for i in range(len(full_number_str) - size + 1):
                        window = full_number_str[i:i+size]
                        try:
                            value = int(window)
                            if min_price <= value <= max_price:
                                if not window.startswith('0'):
                                    best_candidate = value
                                    break
                        except ValueError:
                            continue
                    if best_candidate:
                        break
        else:
            # Para ARS, usar ventana de 8 dígitos
            window_size = 8
            for i in range(len(full_number_str) - window_size + 1):
                window = full_number_str[i:i+window_size]
                try:
                    value = int(window)
                    if min_price <= value <= max_price:
                        if not window.startswith('0'):
                            best_candidate = value
                            break
                except ValueError:
                    continue
        
        if best_candidate:
            return float(best_candidate), currency
        
        # Si nada funcionó, intentar con grupos individuales
        for num_str in reversed(all_numbers):  # Empezar por los más largos
            try:
                num = int(num_str)
                if min_price <= num <= max_price:
                    return float(num), currency
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

# ========================================
# SCRAPER DE ARGENPROP
# ========================================

class ArgenpropScraper(BaseScraper):
    """Scraper específico para Argenprop"""
    
    def __init__(self):
        super().__init__("https://www.argenprop.com", "argenprop")
    
    def build_url(self, zone: str, operation: str, property_type: str) -> str:
        """Construye URL para Argenprop"""
        # Mapeo de operaciones
        op_map = {
            "venta": "venta",
            "alquiler": "alquiler"
        }
        
        # Mapeo de tipos de propiedad
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
        
        # Construir URL
        if zone:
            url = f"{self.base_url}/{p_type}/{op}/{zone}"
        else:
            url = f"{self.base_url}/{p_type}/{op}"
        
        return url
    
    def parse_properties(self, html: str) -> List[PropertyData]:
        """Parsea propiedades de Argenprop"""
        properties = []
        
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            
            # Selectores para Argenprop (adaptativos a cambios)
            cards = soup.select('div.listing__item, div.card, div[data-qa="posting"]')
            
            if not cards:
                # Intentar selectores alternativos
                cards = soup.select('articleposting-card, divposting')
            
            for card in cards:
                try:
                    prop = self._parse_card(card)
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
    
    def _parse_card(self, card) -> Optional[PropertyData]:
        """Parsea una tarjeta individual de Argenprop"""
        try:
            # Extraer precio
            price_elem = card.select_one('.card__price, [data-qa="card-price"], .price')
            price_text = price_elem.get_text(strip=True) if price_elem else ""
            price, currency = self._clean_price(price_text)
            
            if price == 0:
                return None  # Saltar propiedades sin precio
            
            # Extraer dirección
            addr_elem = card.select_one('.card__address, [data-qa="card-address"], .address')
            address = addr_elem.get_text(strip=True) if addr_elem else ""
            
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
                location=address.split(',')[-1].strip() if ',' in address else address,
                address=address,
                property_type="departamento",
                operation_type="venta",
                url=url
            )
            
        except Exception as e:
            logger.debug(f"Error en _parse_card: {e}")
            return None

# ========================================
# SCRAPER DE ZONAPROP
# ========================================

class ZonapropScraper(BaseScraper):
    """Scraper específico para Zonaprop"""
    
    def __init__(self):
        super().__init__("https://www.zonaprop.com.ar", "zonaprop")
    
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
        
        if zone:
            url = f"{self.base_url}/{p_type}/{op}/{zone}.html"
        else:
            url = f"{self.base_url}/{p_type}/{op}.html"
        
        return url
    
    def parse_properties(self, html: str) -> List[PropertyData]:
        """Parsea propiedades de Zonaprop"""
        properties = []
        
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(html, 'html.parser')
            
            # Selectores para Zonaprop
            cards = soup.select('[data-qa="posting"], divposting-card, div[data-posting-id]')
            
            if not cards:
                cards = soup.select('divposting, articleposting')
            
            for card in cards:
                try:
                    prop = self._parse_card(card)
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
    
    def _parse_card(self, card) -> Optional[PropertyData]:
        """Parsea una tarjeta individual de Zonaprop"""
        try:
            # Extraer precio
            price_elem = card.select_one('[data-qa="POSTING_CARD_PRICE"], .price, .posting-price')
            price_text = price_elem.get_text(strip=True) if price_elem else ""
            price, currency = self._clean_price(price_text)
            
            if price == 0:
                return None
            
            # Extraer dirección
            addr_elem = card.select_one('[data-qa="POSTING_CARD_LOCATION"], .location, .posting-location')
            address = addr_elem.get_text(strip=True) if addr_elem else ""
            
            # Extraer título
            title_elem = card.select_one('[data-qa="POSTING_CARD_TITLE"], h2, h3, .posting-title')
            title = title_elem.get_text(strip=True) if title_elem else address
            
            # Extraer URL
            link_elem = card.select_one('a[href]')
            url = link_elem['href'] if link_elem and link_elem.has_attr('href') else ""
            if url and not url.startswith('http'):
                url = f"{self.base_url}{url}"
            
            # Superficie
            features = card.select('[data-qa="POSTING_CARD_FEATURES"], .features, .posting-features li')
            surface = 0.0
            for feature in features:
                text = feature.get_text(strip=True)
                if 'm²' in text or 'm2' in text.lower():
                    surface = self._clean_surface(text)
                    break
            
            # Calcular precio por m2
            price_m2 = self._calculate_price_per_m2(price, surface, currency)
            
            return PropertyData(
                source=self.source_name,
                external_id=url.split('/')[-1].replace('.html', '') if url else "",
                title=title,
                price_amount=price,
                price_currency=currency,
                price_per_m2=price_m2,
                surface_total=surface,
                surface_covered=surface,
                location=address,
                address=address,
                property_type="departamento",
                operation_type="venta",
                url=url
            )
            
        except Exception as e:
            logger.debug(f"Error en _parse_card: {e}")
            return None

# ========================================
# ANALIZADOR DE MERCADO
# ========================================

class MarketAnalyzer:
    """Analiza datos del mercado inmobiliario"""
    
    @staticmethod
    def calculate_stats(properties: List[PropertyData], zone: str, operation: str, prop_type: str) -> MarketStats:
        """Calcula estadísticas del mercado desde propiedades scrappeadas"""
        errors = []
        source_breakdown = {}
        currency_dist = {}
        properties_list = []
        
        if not properties:
            return MarketStats(
                zone=zone,
                operation_type=operation,
                property_type=prop_type,
                sample_size=0,
                average_price_per_m2=None,
                average_total_price=None,
                median_price_per_m2=None,
                min_price_per_m2=None,
                max_price_per_m2=None,
                price_range_total=None,
                currency_distribution={},
                source_breakdown={},
                properties=[],
                errors=["No se pudieron obtener datos del mercado"]
            )
        
        # Recopilar precios por m2
        prices_per_m2 = []
        total_prices = []
        
        for prop in properties:
            # Contabilizar por fuente
            source_breakdown[prop.source] = source_breakdown.get(prop.source, 0) + 1
            
            # Contabilizar por moneda
            currency_dist[prop.price_currency] = currency_dist.get(prop.price_currency, 0) + 1
            
            # Solo calcular para propiedades con datos válidos
            if prop.price_per_m2 > 0:
                prices_per_m2.append(prop.price_per_m2)
            
            if prop.price_amount > 0:
                total_prices.append(prop.price_amount)
            
            # Agregar a lista de propiedades
            properties_list.append({
                "source": prop.source,
                "title": prop.title,
                "price": prop.price_amount,
                "currency": prop.price_currency,
                "price_m2": prop.price_per_m2,
                "surface": prop.surface_total,
                "address": prop.address,
                "url": prop.url
            })
        
        # Calcular estadísticas
        from statistics import mean, median, stdev
        
        avg_price_m2 = None
        median_price_m2 = None
        min_price_m2 = None
        max_price_m2 = None
        
        if prices_per_m2:
            avg_price_m2 = mean(prices_per_m2)
            median_price_m2 = median(prices_per_m2)
            min_price_m2 = min(prices_per_m2)
            max_price_m2 = max(prices_per_m2)
        
        avg_total = None
        if total_prices:
            avg_total = mean(total_prices)
        
        # Rango de precios total
        price_range = None
        if total_prices:
            min_p = min(total_prices)
            max_p = max(total_prices)
            price_range = f"{min_p:,.0f} - {max_p:,.0f}"
        
        return MarketStats(
            zone=zone,
            operation_type=operation,
            property_type=prop_type,
            sample_size=len(properties),
            average_price_per_m2=avg_price_m2,
            average_total_price=avg_total,
            median_price_per_m2=median_price_m2,
            min_price_per_m2=min_price_m2,
            max_price_per_m2=max_price_m2,
            price_range_total=price_range,
            currency_distribution=currency_dist,
            source_breakdown=source_breakdown,
            properties=properties_list,
            errors=errors
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
                "median_price_per_m2": round(stats.median_price_per_m2, 2) if stats.median_price_per_m2 else None,
                "min_price_per_m2": round(stats.min_price_per_m2, 2) if stats.min_price_per_m2 else None,
                "max_price_per_m2": round(stats.max_price_per_m2, 2) if stats.max_price_per_m2 else None,
                "price_range_total": stats.price_range_total
            },
            "currency_distribution": stats.currency_distribution,
            "source_breakdown": stats.source_breakdown,
            "properties_sample": stats.properties[:10],  # Primeros 10
            "total_properties_analyzed": len(stats.properties),
            "analysis_timestamp": datetime.now().isoformat(),
            "errors": stats.errors
        }


# ========================================
# GESTOR DE SCRAPING
# ========================================

class ScrapingManager:
    """Gestiona el scraping de múltiples portales"""
    
    def __init__(self):
        self.argenprop = ArgenpropScraper()
        self.zonaprop = ZonapropScraper()
        self.analyzer = MarketAnalyzer()
    
    def scrape_market(self, zone: str, operation: str = "venta", 
                      property_type: str = "departamento") -> Dict[str, Any]:
        """
        Realiza scraping de mercado inmobiliario
        
        Args:
            zone: Barrio o zona (ej: "palermo", "microcentro")
            operation: Tipo de operación ("venta" o "alquiler")
            property_type: Tipo de propiedad ("departamento", "casa", etc.)
        
        Returns:
            Diccionario con estadísticas del mercado
        """
        logger.info(f"[ScrapingManager] Iniciando scraping para {zone} ({operation}, {property_type})")
        
        all_properties = []
        errors = []
        
        # Escanear Argenprop
        try:
            argenprop_url = self.argenprop.build_url(zone, operation, property_type)
            logger.info(f"[Argenprop] URL: {argenprop_url}")
            
            html = self.argenprop._make_request(argenprop_url)
            if html:
                properties = self.argenprop.parse_properties(html)
                all_properties.extend(properties)
                logger.info(f"[Argenprop] Obtenidas {len(properties)} propiedades")
            else:
                errors.append("Argenprop: No se pudo obtener respuesta")
        except Exception as e:
            logger.error(f"[Argenprop] Error: {e}")
            errors.append(f"Argenprop: {str(e)}")
        
        # Escanear Zonaprop
        try:
            zonaprop_url = self.zonaprop.build_url(zone, operation, property_type)
            logger.info(f"[Zonaprop] URL: {zonaprop_url}")
            
            html = self.zonaprop._make_request(zonaprop_url)
            if html:
                properties = self.zonaprop.parse_properties(html)
                all_properties.extend(properties)
                logger.info(f"[Zonaprop] Obtenidas {len(properties)} propiedades")
            else:
                errors.append("Zonaprop: No se pudo obtener respuesta")
        except Exception as e:
            logger.error(f"[Zonaprop] Error: {e}")
            errors.append(f"Zonaprop: {str(e)}")
        
        # Calcular estadísticas
        stats = self.analyzer.calculate_stats(all_properties, zone, operation, property_type)
        
        if errors:
            stats.errors.extend(errors)
        
        # Convertir a diccionario
        result = MarketAnalyzer.to_dict(stats)
        result['raw_properties_count'] = len(all_properties)
        
        logger.info(f"[ScrapingManager] Completado: {stats.sample_size} propiedades analizadas")
        
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
    
    parser = argparse.ArgumentParser(description="Scraper de Mercado Inmobiliario")
    parser.add_argument("zone", help="Zona a analizar (ej: palermo, microcentro)")
    parser.add_argument("--operation", default="venta", help="Tipo de operación")
    parser.add_argument("--type", default="departamento", help="Tipo de propiedad")
    
    args = parser.parse_args()
    
    manager = ScrapingManager()
    result = manager.scrape_market(args.zone, args.operation, args.type)
    
    print("\n" + "=" * 70)
    print("📊 RESULTADO DEL ANÁLISIS DE MERCADO")
    print("=" * 70)
    print(json.dumps(result, indent=2, ensure_ascii=False))
