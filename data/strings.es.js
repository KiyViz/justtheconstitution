// Tabla de cadenas de texto en español — entrada para build.js.
// Este archivo es leído por build.js, NO se sirve directamente al navegador.

module.exports = {
  // ── Accesibilidad ──
  "a11y.skip_to_content":     "Saltar a la Constitución",

  // ── Metadatos de página ──
  "meta.title":               "Constitución de EE. UU. — Texto completo y las 27 enmiendas | justtheconstitution.org",
  "meta.description":         "El texto completo de la Constitución de los Estados Unidos y sus veintisiete enmiendas, junto al pergamino original de los Archivos Nacionales. Sin anuncios. Sin comentarios. Solo la información.",
  "meta.og_title":            "Solo la Constitución",
  "meta.og_description":      "El texto completo de la Constitución de EE. UU. y las 27 enmiendas. Sin anuncios. Sin comentarios. Solo el documento fundacional.",

  // ── Título del documento ──
  "doc.title":                "La Constitución de los Estados Unidos",
  "doc.subtitle":             "El texto completo, tal como se inscribió en 1787, con las veintisiete enmiendas.",
  "doc.tag":                  "Nosotros, el Pueblo \u00b7 17 de septiembre de 1787",

  // ── Secciones ──
  "section.main_document":    "Documento Principal",
  "section.amendments":       "Enmiendas",
  "section.amendments_intro": "Veintisiete enmiendas ratificadas entre 1791 y 1992. Las primeras diez forman la Carta de Derechos.",
  "section.signatures":       "Firmas",
  "section.preamble":         "Preámbulo",

  // ── Prefijos de enmienda / artículo ──
  "prefix.amendment":         "Enmienda",
  "prefix.ratified":          "Ratificada en",
  "prefix.commonly_known":    "Comúnmente conocido como",
  "prefix.article":           "Artículo",
  "prefix.section":           "Sección",
  "prefix.clause":            "Cláusula",
  "prefix.paragraph":         "\u00b6",

  // ── Citación ──
  "cite.us_constitution":     "Constitución de EE.\u00a0UU.",
  "cite.source_label":        "Fuente:",

  // Primitivos de citación — usados por citations.js. Las convenciones
  // Bluebook/MLA/Chicago son anglófonas, así que estos valores quedan
  // en inglés; el marcador "(traducción al español)" se añade al final
  // de cada cita para indicar que el texto citado es una traducción.
  "cite.constitution_long":   "U.S. Constitution",
  "cite.constitution_short":  "U.S. Const.",
  "cite.translation_marker":  "(traducción al español)",
  "cite.bluebook.preamble":   "pmbl.",
  "cite.bluebook.signatures": "sigs.",
  "cite.bluebook.art":        "art.",
  "cite.bluebook.amend":      "amend.",
  "cite.bluebook.section":    "§",
  "cite.bluebook.clause":     "cl.",
  "cite.mla.const":           "US Const.",
  "cite.mla.preamble":        "preamble",
  "cite.mla.signatures":      "signatures",
  "cite.mla.art":             "art.",
  "cite.mla.amend":           "amend.",
  "cite.mla.section":         "sec.",
  "cite.mla.clause":          "cl.",
  "cite.chicago.art":         "art.",
  "cite.chicago.amend":       "amend.",
  "cite.chicago.section":     "§",
  "cite.chicago.clause":      "cl.",

  // ── Botones de copia ──
  "copy.excerpt":             "Copiar extracto",
  "copy.passage":             "Copiar pasaje",
  "copy.all":                 "Copiar todo",
  "copy.to_clipboard":        "Copiar al portapapeles",

  // ── Mensajes emergentes ──
  "toast.copied":             "Copiado",
  "toast.copy_failed":        "Error al copiar",
  "toast.link_copied":        "Enlace copiado",

  // ── Botones del encabezado ──
  "btn.contents":             "Contenido",
  "btn.contents_aria":        "Abrir tabla de contenido",
  "btn.search_aria":          "Buscar en el documento",
  "btn.search_title":         "Buscar (Ctrl/Cmd+F)",
  "btn.share":                "Compartir",
  "btn.share_aria":           "Compartir",
  "btn.reader_aria":          "Modo de lectura pura",
  "btn.reader_title":         "Modo lectura",
  "btn.mode_aria":            "Cambiar modo oscuro",
  "btn.mode_title":           "Oscuro / claro",
  "btn.settings_aria":        "Abrir configuración",
  "btn.settings_title":       "Configuración",

  // ── Barra de búsqueda ──
  "search.placeholder":       "Buscar en el documento",
  "search.prev_aria":         "Resultado anterior",
  "search.prev_title":        "Anterior (Shift+Enter)",
  "search.next_aria":         "Siguiente resultado",
  "search.next_title":        "Siguiente (Enter)",
  "search.close_aria":        "Cerrar búsqueda",
  "search.close_title":       "Cerrar (Esc)",
  "search.no_results":        "Sin resultados",
  "search.counter":           "{current} de {total}",

  // ── Barra de progreso ──
  "progress.aria":            "Progreso de lectura",
  "progress.preamble":        "Preámbulo",
  "progress.preamble_short":  "Pre",
  "progress.signatures":      "Firmas",
  "progress.signatures_short":"Fir",

  // ── Tabla de contenido ──
  "toc.drawer_aria":          "Tabla de contenido",
  "toc.close_aria":           "Cerrar contenido",
  "toc.inline_aria":          "Contenido (barra lateral)",
  "toc.download_aria":        "Descargar transcripción en Markdown",
  "toc.download_title":       "Descargar transcripción",

  // ── Panel de texto ──
  "text.pane_aria":           "Texto de la Constitución",

  // ── Panel de imagen ──
  "image.pane_aria":          "Imagen del pergamino original",
  "image.page_tag_prefix":    "PÁGINA 0",
  "image.prev_aria":          "Página anterior",
  "image.prev_title":         "Imagen anterior",
  "image.next_aria":          "Página siguiente",
  "image.next_title":         "Imagen siguiente",
  "image.zoom_aria":          "Ampliar",
  "image.zoom_title":         "Ampliar",
  "image.download_aria":      "Descargar alta resolución",
  "image.download_title":     "Descargar",
  "image.collapse_aria":      "Ocultar panel de pergamino",
  "image.collapse_title":     "Ocultar pergamino",
  "image.expand_aria":        "Mostrar panel de pergamino",
  "image.expand_title":       "Mostrar pergamino",
  "image.frame_aria":         "Pergamino original de la Constitución",
  "image.img_alt":            "Pergamino original, página actual",
  "image.source_link":        "Alta res. \u2197",
  "image.error_prefix":       "No se pudo cargar",
  "image.error_view":         "Ver los",
  "image.error_link":         "originales en alta resolución",
  "image.error_suffix":       "en los Archivos Nacionales.",
  "image.page_caption_1":     "Preámbulo hasta Artículo I, \u00a77",
  "image.page_caption_2":     "Artículo I, \u00a78 hasta Artículo II, \u00a71",
  "image.page_caption_3":     "Artículo II, \u00a72 hasta Artículo IV",
  "image.page_caption_4":     "Artículo V hasta firmas",
  "image.bor_title":          "Carta de Derechos",
  "image.bor_tag":            "CARTA DE DERECHOS",
  "image.bor_caption":        "Ratificada el 15 de diciembre de 1791 \u2014 Enmiendas I\u2013X",
  "image.view_original":      "Ver página original",
  "image.page_chip":          "Página {n} →",

  // ── Visor ampliado ──
  "lb.aria":                  "Pergamino ampliado",
  "lb.caption_label":         "Descripción",
  "lb.zoom_out_aria":         "Alejar",
  "lb.zoom_out_title":        "Alejar",
  "lb.zoom_in_aria":          "Acercar",
  "lb.zoom_in_title":         "Acercar",
  "lb.reset_aria":            "Restablecer zoom",
  "lb.reset_title":           "Restablecer",
  "lb.download_aria":         "Descargar resolución completa",
  "lb.download_title":        "Descargar resolución completa",
  "lb.download_span":         "Res. completa",
  "lb.close_aria":            "Cerrar",
  "lb.close_title":           "Cerrar",
  "lb.img_alt":               "Pergamino en resolución completa",

  // ── Panel de configuración ──
  "settings.title":           "Configuración",
  "settings.close_aria":      "Cerrar configuración",
  "settings.tools":           "Herramientas",
  "settings.mode":            "Modo",
  "settings.mode_light":      "Claro",
  "settings.mode_dark":       "Oscuro",
  "settings.mode_oled":       "OLED",
  "settings.color":           "Color",
  // Copiar / formato de cita — chips arriba del pliegue. Etiquetas cortas.
  "settings.copy_label":      "Copiar",
  "settings.copy_plain":      "Plano",
  "settings.copy_bluebook":   "Bluebook",
  "settings.copy_mla":        "MLA",
  "settings.copy_chicago":    "Chicago",
  "settings.copy_markdown":   "MD",
  "settings.copy_bibtex":     "BibTeX",
  "settings.text_size":       "Tamaño de texto",
  "settings.size_small":      "Pequeño",
  "settings.size_medium":     "Mediano",
  "settings.size_large":      "Grande",
  "settings.advanced":        "Configuración avanzada",
  "settings.saturation":      "Saturación",
  "settings.sat_default":     "Predeterminado",
  "settings.sat_vibrant":     "Vibrante",
  "settings.typeface":        "Tipografía",
  "settings.font_default":    "Predeterminada",
  "settings.font_serif":      "Serif",
  "settings.font_sans":       "Sans-serif",
  "settings.font_mono":       "Monoespaciada",
  "settings.reset_aria":      "Restablecer todos los ajustes",
  "settings.reset_title":     "Restablecer ajustes",
  "settings.reset_toast":     "Ajustes restablecidos",
  "settings.switch_dark":     "Cambiar a modo oscuro",
  "settings.switch_dark_short":"Cambiar a oscuro",
  "settings.switch_oled":     "Cambiar a OLED",
  "settings.switch_oled_short":"Cambiar a OLED",
  "settings.switch_light":    "Cambiar a modo claro",
  "settings.switch_light_short":"Cambiar a claro",

  // ── Modo lectura ──
  "reader.exit_aria":         "Salir del modo lectura",
  "reader.exit_label":        "Salir del modo lectura",
  "reader.switch_mode_aria":  "Cambiar modo",
  "reader.switch_mode_title": "Claro / Oscuro / OLED",
  "reader.settings_aria":     "Abrir configuración",
  "reader.settings_title":    "Configuración",

  // ── Compartir ──
  "share.aria":               "Compartir",
  "share.copy_link":          "Copiar enlace",
  "share.email":              "Correo electrónico",
  "share.more":               "Más\u2026",
  "share.email_body_prefix":  "Pensé que esto podría interesarte:\n\n",
  "share.toast_default":      "Enlace copiado",

  // ── Descarga ──
  "download.heading":         "Llévalo contigo.",
  "download.description":     "El documento completo \u2014 preámbulo, artículos, firmas, las veintisiete enmiendas \u2014 como un archivo Markdown. Legible en cualquier lugar.",
  "download.button":          "Descargar transcripción",
  "download.filename":        "constitucion-eeuu.md",
  "download.hint":            "constitucion-eeuu.md · texto",

  // ── Exportación Markdown ──
  "md.source_footer":         "Fuente: [justtheconstitution.org](https://justtheconstitution.org)",

  // ── Pie de página ──
  "footer.sources":           "Fuentes.",
  "footer.national_archives": "Archivos Nacionales",
  "footer.images":            "Imágenes.",
  "footer.images_link":       "Archivos Nacionales \u2014 Descargas en Alta Resolución",
  "footer.tagline":           "Sin anuncios. Sin comentarios. Solo la información.",
  "footer.byline":            "Un proyecto de KiyViz.",
  "footer.info_link":         "Acerca · Privacidad · Contacto",
  "footer.contact_email":     "feedback@justtheconstitution.org",

  // ── Página de información ──
  "info.title":               "Acerca — Solo la Constitución",
  "info.meta_description":    "Qué es justtheconstitution.org, por qué existe y cómo manejamos tus datos.",
  "info.mission_heading":     "Acerca de este sitio",
  "info.mission_p1":          "justtheconstitution.org presenta el texto completo de la Constitución de los Estados Unidos y sus veintisiete enmiendas junto a facsímiles del pergamino original. Sin anuncios. Sin comentarios. Sin muro de pago. Solo el documento fundacional, legible y gratuito.",
  "info.mission_p2":          "El sitio está abierto a todos—estudiantes, educadores, investigadores, o cualquier persona que quiera leer el documento que define la gobernanza estadounidense.",

  "info.faq_heading":         "Preguntas Frecuentes",
  "info.faq_q1":              "¿Qué es este sitio?",
  "info.faq_a1":              "Una experiencia de lectura gratuita y sin anuncios para la Constitución de EE. UU. El texto completo con los escaneos originales del pergamino mostrados lado a lado.",
  "info.faq_q2":              "¿De dónde proviene el texto?",
  "info.faq_a2":              "Los Artículos I–VII y firmas están transcritos de los Archivos Nacionales, preservando la ortografía y puntuación originales. Las Enmiendas I–XXVII provienen del National Constitution Center. Ambas fuentes fueron comparadas; no se encontraron discrepancias.",
  "info.faq_q3":              "¿Es este un sitio web oficial del gobierno?",
  "info.faq_a3":              "No. Este es un proyecto independiente. El texto y las imágenes provienen de archivos gubernamentales oficiales, pero este sitio no está afiliado ni respaldado por ninguna agencia del gobierno.",
  "info.faq_q4":              "¿Puedo descargar el texto?",
  "info.faq_a4":              "Sí. Una descarga en formato Markdown está disponible al final de la página de lectura. Contiene el documento completo incluyendo todas las enmiendas.",
  "info.faq_q5":              "¿Por qué la ortografía es inusual?",
  "info.faq_a5":              "El documento original de 1787 usa ortografía y mayúsculas del inglés del siglo XVIII. Lo preservamos exactamente como fue inscrito por Jacob Shallus en el pergamino.",
  "info.faq_q6":              "¿Cómo cito esto?",
  "info.faq_a6":              "Use el botón de copiar en cualquier párrafo para obtener una cita formateada en estilo Bluebook, MLA o Chicago. El motor de citación genera la referencia automáticamente.",

  "info.privacy_heading":     "Privacidad",
  "info.privacy_updated":     "Última actualización: mayo de 2026.",
  "info.privacy_no_cookies":  "Este sitio no usa cookies. No te rastreamos. No vendemos datos.",
  "info.privacy_analytics":   "Usamos Cloudflare Web Analytics para monitorear el rendimiento del sitio. Esto recopila datos anónimos y agregados (vistas de página, geografía a nivel de país, referente) sin información personal identificable. Es libre de cookies y cumple con la normativa de la UE.",
  "info.privacy_localstorage":"Tu posición de lectura y preferencias de visualización se guardan en el almacenamiento local de tu navegador para que puedas continuar donde lo dejaste. Estos datos nunca salen de tu dispositivo.",
  "info.privacy_contact":     "Si nos contactas a través del formulario a continuación, usamos tu correo electrónico únicamente para responder. No te agregamos a ninguna lista de correo ni compartimos tu información con terceros.",

  "info.contact_heading":     "Contacto",
  "info.contact_intro":       "Preguntas, correcciones o comentarios—nos gustaría saber de ti.",
  "info.contact_email_label": "Tu correo electrónico",
  "info.contact_category_label": "Categoría",
  "info.contact_category_placeholder": "Selecciona una categoría…",
  "info.contact_cat_general": "Comentario general",
  "info.contact_cat_bug":     "Reporte de error",
  "info.contact_cat_content": "Sugerencia de contenido",
  "info.contact_cat_accessibility": "Problema de accesibilidad",
  "info.contact_rating_label": "¿Cómo calificarías tu experiencia?",
  "info.contact_msg_label":   "Cuéntanos por qué",
  "info.contact_msg_placeholder": "¿Qué motivó esta calificación?",
  "info.contact_submit":      "Enviar",
  "info.contact_success":     "Mensaje enviado. Gracias.",
  "info.contact_error":       "Algo salió mal. Por favor intenta el enlace de correo a continuación.",
  "info.contact_alt":         "O escribe directamente a: feedback@justtheconstitution.org",

  // ── Selector de idioma ──
  "lang.button_aria":         "Cambiar idioma",
  "lang.button_title":        "Idioma",

  // ── Schema.org ──
  // ── Página para educadores ──
  "educators.title":          "Para educadores — Solo la Constitución",
  "educators.meta_description": "Use justtheconstitution.org en su aula. Enlaces directos a cada artículo y enmienda, guía de citación y herramientas para compartir con estudiantes.",
  "educators.heading":        "Para educadores",
  "educators.intro":          "justtheconstitution.org está diseñado para el aula. Sin anuncios, sin distracciones y disponible en cualquier dispositivo que usen sus estudiantes. Sin cuentas, sin registro, sin costo.",
  "educators.use_heading":    "Cómo usar esto en su aula",
  "educators.use_p1":         "La página de lectura está diseñada tanto para estudio guiado como independiente:",
  "educators.use_li1":        "Asigne secciones específicas usando los enlaces directos a continuación — los estudiantes llegan exactamente donde usted quiere.",
  "educators.use_li2":        "El motor de citación integrado genera referencias en Bluebook, MLA y Chicago automáticamente. Los estudiantes copian un párrafo y obtienen una cita con formato correcto.",
  "educators.use_li3":        "El progreso de lectura se guarda localmente en el navegador de cada estudiante. Pueden continuar donde se quedaron sin crear una cuenta.",
  "educators.use_li4":        "Funciona en teléfonos, tabletas y computadoras portátiles. Modo oscuro y tamaño de texto ajustable para diferentes entornos de lectura.",
  "educators.links_heading":  "Enlaces directos a secciones clave",
  "educators.links_intro":    "Comparta estos enlaces con sus estudiantes o péguelos en su plan de estudios. Cada uno abre la página de lectura desplazada a la sección exacta.",
  "educators.link_preamble":  "Preámbulo",
  "educators.link_art1":      "Artículo I — El Legislativo",
  "educators.link_art2":      "Artículo II — El Ejecutivo",
  "educators.link_art3":      "Artículo III — El Judicial",
  "educators.link_amendments":"Todas las enmiendas",
  "educators.link_bor":       "Carta de Derechos (Enmiendas I–X)",
  "educators.link_13th":      "Enmienda 13 — Abolición de la esclavitud",
  "educators.link_14th":      "Enmienda 14 — Protección igualitaria",
  "educators.link_19th":      "Enmienda 19 — Sufragio femenino",
  "educators.cite_heading":   "Cómo deben citar los estudiantes",
  "educators.cite_p1":        "Cada párrafo en la página de lectura tiene un botón de copiar. Tóquelo para elegir un formato de cita: Bluebook, MLA, Chicago, Markdown o BibTeX.",
  "educators.cite_p2":        "El motor de citación identifica el artículo, sección y cláusula exactos automáticamente. Sin formato manual necesario.",
  "educators.share_heading":  "Comparta con su clase",
  "educators.share_p1":       "Copie y envíe este enlace a sus estudiantes. Funciona en cualquier dispositivo, no requiere configuración y nunca les pedirá que se registren.",
  "educators.share_url":      "justtheconstitution.org",

  "schema.name":              "Constitución de los Estados Unidos",

  // ── Sufijos ordinales (para etiquetas de imágenes de enmiendas) ──
  "ordinal.st":               "\u00ba",
  "ordinal.nd":               "\u00ba",
  "ordinal.rd":               "\u00ba",
  "ordinal.th":               "\u00ba"
};
