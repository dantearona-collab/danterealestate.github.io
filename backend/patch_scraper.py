import os
import re

file_path = "c:\\Users\\artar\\Downloads\\Api PAGINAWEB-IA\\backend\\logic\\market_scraper.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. New imports and _remove_outliers should already be there if the first replace worked
# But just in case, we'll replace the calculate_stats function completely

new_calculate_stats = """    @staticmethod
    def calculate_stats(properties: List[PropertyData], zone: str, operation: str, prop_type: str) -> MarketStats:
        \"\"\"Calcula estadísticas del mercado inmobiliario con normalización y limpieza de outliers\"\"\"
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
        is_terrain = prop_type.lower() in ["terreno", "terrenos"]
        is_sale = operation.lower() == "venta"
        base_currency = \"USD\" if (is_terrain or is_sale) else \"ARS\"
        
        normalized_total_prices = []
        normalized_m2_prices = []
        
        for prop in properties:
            if not MarketAnalyzer._is_in_zone(prop.location, prop.address, zone):
                continue
            
            source_breakdown[prop.source] = source_breakdown.get(prop.source, 0) + 1
            currency_dist[prop.price_currency] = currency_dist.get(prop.price_currency, 0) + 1
            
            price_norm = prop.price_amount
            m2_norm = prop.price_per_m2
            
            if base_currency == \"USD\" and prop.price_currency == \"ARS\":
                price_norm /= USD_RATE
                m2_norm /= USD_RATE
            elif base_currency == \"ARS\" and prop.price_currency == \"USD\":
                price_norm *= USD_RATE
                m2_norm *= USD_RATE
            
            has_low_surface = prop.surface_total < MarketAnalyzer.MIN_SURFACE_THRESHOLD
            if has_low_surface:
                low_surface_count += 1
            
            if not has_low_surface and price_norm > 0:
                normalized_total_prices.append(price_norm)
                if m2_norm > 0:
                    normalized_m2_prices.append(m2_norm)
            
            properties_list.append({
                \"source\": prop.source, \"title\": prop.title, \"price\": prop.price_amount,
                \"currency\": prop.price_currency, \"price_m2\": prop.price_per_m2,
                \"surface\": prop.surface_total, \"address\": prop.address, \"url\": prop.url,
                \"operation_type\": prop.operation_type, \"property_type\": prop.property_type,
                \"surface_warning\": has_low_surface
            })
        
        clean_total_prices = MarketAnalyzer._remove_outliers(normalized_total_prices)
        clean_m2_prices = MarketAnalyzer._remove_outliers(normalized_m2_prices)
        outliers_count = len(normalized_total_prices) - len(clean_total_prices)
        
        from statistics import mean, median
        avg_total = mean(clean_total_prices) if clean_total_prices else None
        avg_m2 = mean(clean_m2_prices) if clean_m2_prices else None
        med_m2 = median(clean_m2_prices) if clean_m2_prices else None
        min_m2 = min(clean_m2_prices) if clean_m2_prices else None
        max_m2 = max(clean_m2_prices) if clean_m2_prices else None
        
        price_range = None
        if clean_total_prices:
            price_range = f\"{min(clean_total_prices):,.0f} - {max(clean_total_prices):,.0f}\"
        
        warnings = []
        if low_surface_count > 0:
            warnings.append(f\"{low_surface_count} propiedades con sup. < {MarketAnalyzer.MIN_SURFACE_THRESHOLD}m² excluidas\")
        if outliers_count > 0:
            warnings.append(f\"{outliers_count} valores atípicos (outliers) descartados\")
        
        return MarketStats(
            zone=zone, operation_type=operation, property_type=prop_type,
            sample_size=len(clean_total_prices),
            average_price_per_m2=avg_m2, average_total_price=avg_total,
            median_price_per_m2=med_m2, min_price_per_m2=min_m2, max_price_per_m2=max_m2,
            price_range_total=price_range, currency_distribution=currency_dist,
            source_breakdown=source_breakdown, properties=properties_list,
            errors=warnings if warnings else errors,
            usd_rate=USD_RATE
        )\"\"\"

# Regex to find the existing calculate_stats function
pattern = r"    @staticmethod\s+def calculate_stats\(properties: List\[PropertyData\], zone: str, operation: str, prop_type: str\) -> MarketStats:.*?return MarketStats\(.*?errors=warnings if warnings else errors\s+\)"

# Use re.DOTALL to match across lines
new_content = re.sub(pattern, new_calculate_stats, content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("✅ File patched successfully.")
