from fpdf import FPDF
from datetime import datetime
import io
import os

class MarketReportPDF(FPDF):
    def __init__(self, logo_path=None, stats_data=None):
        super().__init__()
        self.logo_path = logo_path
        self.stats_data = stats_data or {}
        self.primary_color = (37, 99, 235)
        self.secondary_color = (100, 116, 139)
        self.success_color = (16, 185, 129)
        self.danger_color = (225, 29, 72)
        self.warning_color = (245, 158, 11)

    def header(self):
        if self.logo_path and os.path.exists(self.logo_path):
            try:
                self.image(self.logo_path, 10, 8, 20)
            except:
                pass
        
        self.set_font('Arial', 'B', 16)
        self.set_text_color(*self.primary_color)
        self.set_x(35)
        self.cell(0, 10, 'DANTE PROPIEDADES', 0, 1, 'L')
        
        self.set_font('Arial', '', 10)
        self.set_text_color(*self.secondary_color)
        self.set_x(35)
        self.cell(0, 5, 'INFORME PROFESIONAL DE MERCADO INMOBILIARIO', 0, 1, 'L')
        
        self.set_draw_color(*self.primary_color)
        self.set_line_width(0.5)
        self.line(10, 30, 200, 30)
        
        # Mostrar Tasa de Cambio en el encabezado
        self.set_y(32)
        self.set_x(10)
        self.set_font('Arial', 'B', 8)
        self.set_text_color(*self.secondary_color)
        # Obtenemos la tasa desde el dict de datos si está disponible
        usd_rate = self.stats_data.get('data', {}).get('statistics', {}).get('usd_rate_used', 1200.0)
        self.cell(0, 5, f'TASA DE CAMBIO DE REFERENCIA: 1 USD = {usd_rate:,.0f} ARS', 0, 1, 'R')
        
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(128, 128, 128)
        date_str = datetime.now().strftime("%d/%m/%Y %H:%M")
        self.cell(0, 10, f'Reporte generado automáticamente el {date_str} - Página {self.page_no()}', 0, 0, 'C')

    def draw_bar_chart(self, title, data_dict, max_val=None, color=(37, 99, 235), suffix="", width=100):
        start_x = self.get_x()
        self.set_font('Arial', 'B', 11)
        self.set_text_color(31, 41, 55)
        self.cell(width, 10, title, 0, 0, 'L')
        self.ln(10)
        self.set_x(start_x)
        
        if not data_dict: 
            self.set_font('Arial', 'I', 9)
            self.cell(0, 7, 'Sin datos disponibles para este gráfico.', 0, 1)
            return
        
        if max_val is None:
            max_val = max(data_dict.values()) if data_dict.values() else 1
            
        full_width = width - 60 # Espacio para etiquetas y valores
        start_x = self.get_x()
        
        for label, value in data_dict.items():
            self.set_font('Arial', '', 9)
            self.set_text_color(31, 41, 55)
            self.cell(40, 7, label[:20].capitalize(), 0, 0)
            
            curr_x, curr_y = self.get_x(), self.get_y() + 1.5
            self.set_fill_color(243, 244, 246)
            self.rect(curr_x, curr_y, full_width, 4, 'F')
            
            bar_width = (value / max_val) * full_width if max_val > 0 else 0
            self.set_fill_color(*color)
            self.rect(curr_x, curr_y, bar_width, 4, 'F')
            
            self.set_x(curr_x + full_width + 5)
            val_text = f"{value:,.0f} {suffix}" if isinstance(value, (int, float)) else f"{value}"
            self.cell(20, 7, val_text, 0, 1)
            self.set_x(start_x)
        self.ln(5)

    def draw_scatter_plot(self, title, points, currency_symbol, width=80):
        x_base = self.get_x()
        self.set_font('Arial', 'B', 11)
        self.set_text_color(31, 41, 55)
        self.cell(width, 10, title, 0, 0, 'L')
        self.ln(10)
        self.set_x(x_base)
        
        valid_points = [p for p in points if p.get('surface', 0) > 2 and p.get('price', 0) > 0]
        if not valid_points: 
            self.set_font('Arial', 'I', 9)
            self.cell(0, 10, 'No hay suficientes datos válidos para este gráfico.', 0, 1)
            return

        chart_w, chart_h = width - 20, 45 
        start_x, start_y = self.get_x() + 15, self.get_y()
        max_x = max(p['surface'] for p in valid_points) * 1.1
        max_y = max(p['price'] for p in valid_points) * 1.1
        
        self.set_draw_color(200, 200, 200)
        self.set_line_width(0.3)
        self.line(start_x, start_y + chart_h, start_x + chart_w, start_y + chart_h)
        self.line(start_x, start_y, start_x, start_y + chart_h)
        
        self.set_font('Arial', '', 7)
        self.set_text_color(100, 116, 139)
        for i in range(6):
            val_x = (max_x / 5) * i
            x_pos = start_x + (val_x / max_x) * chart_w
            self.text(x_pos - 3, start_y + chart_h + 5, f"{(val_x or 0):,.0f} m2")
        
        for i in range(6):
            val_y = (max_y / 5) * i
            y_pos = start_y + chart_h - (val_y / max_y) * chart_h
            self.text(start_x - 14, y_pos + 1.5, f"{currency_symbol}{(val_y/1000 if val_y else 0):,.0f}k")
            
        self.set_draw_color(*self.primary_color)
        for p in valid_points:
            px = start_x + (p['surface'] / max_x) * chart_w
            py = start_y + chart_h - (p['price'] / max_y) * chart_h
            self.line(px - 1, py - 1, px + 1, py + 1)
            self.line(px - 1, py + 1, px + 1, py - 1)
            
        self.set_y(start_y + chart_h + 10)

def generate_market_report(data):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    logo_path = os.path.join(base_dir, "llave.png")
    
    pdf = MarketReportPDF(logo_path=logo_path, stats_data=data)
    pdf.add_page()
    
    zone = data.get('zone', 'Desconocida').capitalize()
    operation = data.get('operation', 'venta').lower()
    prop_type = data.get('property_type', 'departamento').lower()
    
    # Moneda predominante o forzada para terrenos
    if prop_type in ["terreno", "terrenos"]:
        currency_symbol = "USD"
    else:
        currency_symbol = "AR$" if operation == "alquiler" else "USD"
    
    pdf.set_font('Arial', 'B', 13)
    pdf.cell(0, 10, f'Análisis de Mercado: {zone}', 0, 1, 'L')
    pdf.set_font('Arial', '', 10)
    pdf.cell(0, 6, f'Propiedad: {prop_type} | Operación: {operation.capitalize()} | Moneda: {currency_symbol}', 0, 1, 'L')
    pdf.ln(5)

    stats = data.get('data', {}).get('statistics', {})
    sample_size = data.get('data', {}).get('sample_size', 0)
    
    pdf.set_fill_color(248, 250, 252)
    box_w = (pdf.w - 30) / 3
    pdf.set_font('Arial', 'B', 9)
    pdf.set_text_color(*pdf.secondary_color)
    pdf.cell(box_w, 8, ' PRECIO MERCADO', 1, 0, 'C', fill=True); pdf.cell(5, 8, '', 0, 0)
    pdf.cell(box_w, 8, ' m2 ESTIMADO', 1, 0, 'C', fill=True); pdf.cell(5, 8, '', 0, 0)
    pdf.cell(box_w, 8, ' MUESTRA', 1, 1, 'C', fill=True)
    
    pdf.set_font('Arial', 'B', 14); pdf.set_text_color(*pdf.primary_color)
    avg_total = stats.get('median_total_price') or stats.get('average_total_price')
    avg_m2 = stats.get('median_price_per_m2') or stats.get('average_price_per_m2')
    pdf.cell(box_w, 12, f"{currency_symbol} {(avg_total or 0):,.0f}", 1, 0, 'C')
    pdf.cell(5, 12, '', 0, 0)
    pdf.cell(box_w, 12, f"{currency_symbol} {(avg_m2 or 0):,.0f}", 1, 0, 'C')
    pdf.cell(5, 12, '', 0, 0)
    pdf.cell(box_w, 12, str(sample_size or 0), 1, 1, 'C')
    pdf.ln(10)

    # --- BLOQUE DE GRÁFICOS 1 (FUENTES Y RANGOS) ---
    curr_y = pdf.get_y()
    
    # 1. Distribución por Portal
    sources = data.get('data', {}).get('source_breakdown', {})
    pdf.draw_bar_chart('DISTRIBUCIÓN POR PORTAL', sources, color=pdf.primary_color, width=80)
    mid_y1 = pdf.get_y()
    
    # 2. Rango de Precios (Fijos)
    pdf.set_y(curr_y)
    pdf.set_x(120) # Mover más a la derecha
    
    # ... (rest of price range logic)
    properties = data.get('data', {}).get('properties_sample', [])
    price_ranges = {
        '0-200k': 0,
        '200k-500k': 0,
        '500k-1M': 0,
        '1M-5M': 0,
        '5M+': 0
    }
    for p in properties:
        price = p.get('price', 0)
        if price < 200000: price_ranges['0-200k'] += 1
        elif price < 500000: price_ranges['200k-500k'] += 1
        elif price < 1000000: price_ranges['500k-1M'] += 1
        elif price < 5000000: price_ranges['1M-5M'] += 1
        else: price_ranges['5M+'] += 1
    
    pdf.set_x(120)
    pdf.set_font('Arial', 'B', 11); pdf.set_text_color(31, 41, 55)
    pdf.cell(80, 10, 'DISTRIBUCIÓN POR RANGO', 0, 1, 'L')
    max_range = max(price_ranges.values()) if price_ranges.values() else 1
    for label, val in price_ranges.items():
        pdf.set_x(120)
        pdf.set_font('Arial', '', 9); pdf.cell(25, 7, label, 0, 0)
        bar_w = (val / max_range) * 40 if max_range > 0 else 0
        pdf.set_fill_color(243, 244, 246); pdf.rect(pdf.get_x(), pdf.get_y()+1.5, 40, 4, 'F')
        pdf.set_fill_color(*pdf.primary_color); pdf.rect(pdf.get_x(), pdf.get_y()+1.5, bar_w, 4, 'F')
        pdf.set_x(pdf.get_x() + 45)
        pdf.cell(10, 7, str(val), 0, 1)
    
    mid_y2 = pdf.get_y()
    pdf.set_y(max(mid_y1, mid_y2) + 5)
    
    # --- BLOQUE DE GRÁFICOS 2 (COMPARATIVA BARRIOS Y TENDENCIA) ---
    curr_y = pdf.get_y()
    
    # 3. Comparativa por Barrio (Histórico)
    history = data.get('history', [])
    if not history:
        history = [{'zona': zone, 'precio_promedio': avg_total}]
    
    hist_dict = {h['zona']: h['precio_promedio'] for h in history}
    pdf.draw_bar_chart('PRECIO MERCADO POR BARRIO', hist_dict, color=pdf.success_color, suffix=currency_symbol, width=80)
    mid_y1 = pdf.get_y()
    
    # 4. Gráfico de dispersión
    pdf.set_y(curr_y)
    pdf.set_x(120)
    pdf.draw_scatter_plot('TENDENCIA: PRECIO vs SUPERFICIE', properties, currency_symbol, width=80)
    mid_y2 = pdf.get_y()
    
    pdf.set_y(max(mid_y1, mid_y2) + 15)
    
    # Salto de página preventivo si queda poco espacio
    if pdf.get_y() > 220:
        pdf.add_page()
        pdf.set_y(35)
    
    if pdf.get_y() > 180: pdf.add_page()

    # --- LISTADO DETALLADO ---
    pdf.set_fill_color(*pdf.primary_color); pdf.set_text_color(255, 255, 255)
    pdf.set_font('Arial', 'B', 10)
    pdf.cell(0, 10, ' LISTADO DETALLADO DE PROPIEDADES', 0, 1, 'L', fill=True)
    
    pdf.set_fill_color(229, 231, 235); pdf.set_text_color(31, 41, 55); pdf.set_font('Arial', 'B', 8)
    w_title, w_surf, w_price, w_m2 = 120, 15, 30, 25
    pdf.cell(w_title, 8, ' Fuente: Propiedad | Dirección', 1, 0, 'L', fill=True)
    pdf.cell(w_surf, 8, ' m2', 1, 0, 'C', fill=True)
    pdf.cell(w_price, 8, f' {currency_symbol}', 1, 0, 'C', fill=True)
    pdf.cell(w_m2, 8, f' {currency_symbol}/m2', 1, 1, 'C', fill=True)
    
    pdf.set_font('Arial', '', 7)
    for prop in properties[:60]:
        source = prop.get('source', 'Desconocida').capitalize()
        title = prop.get('title', 'Sin título')[:40]
        address = prop.get('address', 'Sin dirección')[:35]
        full_info = f"{source}: {title} | {address}"
        
        surface = prop.get('surface', 0)
        price = prop.get('price', 0)
        price_m2 = prop.get('price_m2', 0)
        warning = prop.get('surface_warning', False) or surface <= 2
        
        if warning:
            pdf.set_text_color(*pdf.danger_color)
            pdf.set_font('Arial', 'B', 6.5)
            pdf.cell(w_title, 6, f" {full_info[:75]} (S. IRREAL!!)", 1, 0, 'L')
        else:
            pdf.set_text_color(31, 41, 55); pdf.set_font('Arial', '', 6.5)
            pdf.cell(w_title, 6, f" {full_info[:85]}", 1, 0, 'L')
            
        pdf.cell(w_surf, 6, f"{(surface or 0):.0f}", 1, 0, 'C')
        pdf.cell(w_price, 6, f"{(price or 0):,.0f}", 1, 0, 'C')
        pdf.cell(w_m2, 6, f"{(price_m2 or 0):,.0f}", 1, 1, 'C')

    has_warnings = any((p.get('surface_warning', False) or p.get('surface', 0) <= 2) for p in properties)
    if has_warnings:
        pdf.ln(5)
        pdf.set_font('Arial', 'B', 9); pdf.set_text_color(*pdf.danger_color)
        pdf.cell(0, 8, '(!) NOTA: Propiedades marcadas con (S. IRREAL!!) no fueron incluidas en los promedios estadísticos.', 0, 1)

    return pdf.output(dest='S')
