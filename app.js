(function() {
    'use strict';

    const App = {
        datos: null,
        init() {
            this.cargarDatos();
            this.eventos();
            this.inicializarChatbot();
        },

        async cargarDatos() {
            try {
                const response = await fetch('datos/productos.json');
                this.datos = await response.json();
                this.renderizarProductos();
                this.renderizarPromociones();
                this.renderizarFAQ();
            } catch (error) {
                console.error('Error cargando datos:', error);
            }
        },

        eventos() {
            this.mobileMenu();
            this.filtroProductos();
            this.formularioContacto();
            this.scrollSuave();
        },

        mobileMenu() {
            const btn = document.querySelector('.mobile-menu-btn');
            const nav = document.querySelector('.nav');
            
            if (btn && nav) {
                btn.addEventListener('click', () => {
                    nav.classList.toggle('active');
                    btn.querySelector('i').classList.toggle('fa-times');
                });

                document.querySelectorAll('.nav-list a').forEach(link => {
                    link.addEventListener('click', () => {
                        nav.classList.remove('active');
                        btn.querySelector('i').classList.remove('fa-times');
                        btn.querySelector('i').classList.add('fa-bars');
                    });
                });
            }
        },

        filtroProductos() {
            const buttons = document.querySelectorAll('.filter-btn');
            const grid = document.getElementById('productsGrid');
            
            if (buttons.length && grid && this.datos) {
                buttons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        buttons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        
                        const category = btn.dataset.category;
                        this.renderizarProductos(category);
                    });
                });
            }
        },

        renderizarProductos(category = 'all') {
            const grid = document.getElementById('productsGrid');
            if (!grid || !this.datos) return;

            const productos = category === 'all' 
                ? this.datos.productos 
                : this.datos.productos.filter(p => p.categoria === category);

            grid.innerHTML = productos.map(producto => `
                <div class="product-card" data-category="${producto.categoria}">
                    <div class="product-image">
                        <i class="fas ${this.getIcono(producto.categoria)}"></i>
                        ${producto.promocion ? '<span class="product-badge">Oferta</span>' : ''}
                    </div>
                    <div class="product-info">
                        <h3>${producto.nombre}</h3>
                        <p>${producto.descripcion}</p>
                        <div class="product-price">
                            <span class="current-price">$${producto.precio}</span>
                            ${producto.precioAnterior ? `<span class="old-price">$${producto.precioAnterior}</span>` : ''}
                        </div>
                        <button class="product-btn" onclick="App.solicitarCotizacion('${producto.nombre}')">
                            Solicitar Cotizacion
                        </button>
                    </div>
                </div>
            `).join('');
        },

        getIcono(categoria) {
            const iconos = {
                polarizado: 'fa-window-maximize',
                electrico: 'fa-bolt',
                audio: 'fa-radio',
                seguridad: 'fa-shield-alt',
                buscahuellas: 'fa-satellite-dish',
                led: 'fa-lightbulb'
            };
            return iconos[categoria] || 'fa-car';
        },

        renderizarPromociones() {
            const grid = document.getElementById('promotionsGrid');
            if (!grid || !this.datos) return;

            grid.innerHTML = this.datos.promociones.map(promo => `
                <div class="promotion-card">
                    <i class="fas fa-gift promotion-icon"></i>
                    <h3>${promo.titulo}</h3>
                    <p>${promo.descripcion}</p>
                    <span class="promotion-discount">${promo.descuento} DESC</span>
                </div>
            `).join('');
        },

        renderizarFAQ() {
            const grid = document.getElementById('faqGrid');
            if (!grid || !this.datos) return;

            grid.innerHTML = this.datos.faq.map(item => `
                <div class="faq-item">
                    <h4><i class="fas fa-question-circle"></i> ${item.pregunta}</h4>
                    <p>${item.respuesta}</p>
                </div>
            `).join('');
        },

        formularioContacto() {
            const form = document.getElementById('contactForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.enviarFormulario(form);
                });
            }
        },

        enviarFormulario(form) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            alert(`Gracias ${data.nombre}! Tu mensaje ha sido enviado. Nos contactaremos pronto.`);
            form.reset();
        },

        solicitarCotizacion(producto) {
            const form = document.getElementById('contactForm');
            if (form) {
                form.mensaje.value = `Hola, me interesa el producto: ${producto}. Por favor envienme una cotizacion.`;
                document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
            }
        },

        scrollSuave() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        },

        inicializarChatbot() {
            const toggle = document.getElementById('chatbotToggle');
            const container = document.getElementById('chatbotContainer');
            const close = document.getElementById('chatbotClose');
            const input = document.getElementById('chatbotInput');
            const send = document.getElementById('chatbotSend');

            if (toggle && container) {
                toggle.addEventListener('click', () => {
                    container.classList.toggle('active');
                });

                if (close) {
                    close.addEventListener('click', () => {
                        container.classList.remove('active');
                    });
                }

                const procesarMensaje = () => {
                    const mensaje = input.value.trim();
                    if (!mensaje) return;

                    this.agregarMensaje(mensaje, 'user');
                    input.value = '';

                    setTimeout(() => {
                        const respuesta = this.generarRespuesta(mensaje);
                        this.agregarMensaje(respuesta, 'bot');
                    }, 500);
                };

                if (send) send.addEventListener('click', procesarMensaje);
                if (input) {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') procesarMensaje();
                    });
                }
            }
        },

        agregarMensaje(texto, tipo) {
            const container = document.getElementById('chatbotMessages');
            if (!container) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = `chatbot-message ${tipo}`;
            messageDiv.innerHTML = `<p>${texto}</p>`;
            container.appendChild(messageDiv);
            container.scrollTop = container.scrollHeight;
        },

        generarRespuesta(mensaje) {
            if (!this.datos) {
                return 'Lo siento, estoy cargando los datos. Por favor intenta en unos segundos.';
            }

            const mensajeLower = mensaje.toLowerCase();
            const chatbot = this.datos.chatbot;
            const faq = this.datos.faq;
            const productos = this.datos.productos;
            const promociones = this.datos.promociones;

            if (this.contienePalabras(mensajeLower, chatbot.palabrasClave.polarizado)) {
                const polarizados = productos.filter(p => p.categoria === 'polarizado');
                let respuesta = 'Tenemos excellent opciones de polarizado:<br><br>';
                polarizados.forEach(p => {
                    respuesta += `• <strong>${p.nombre}</strong>: $${p.precio}${p.promocion ? ' <span style="color:#e74c9a">(En promocion!)</span>' : ''}<br>`;
                    respuesta += `  ${p.descripcion}<br><br>`;
                });
                return respuesta;
            }

            if (this.contienePalabras(mensajeLower, chatbot.palabrasClave.alarmas)) {
                const alarmasc = productos.filter(p => p.categoria === 'seguridad');
                let respuesta = 'Nuestras alarmas son de la mejor calidad:<br><br>';
                alarmasc.forEach(p => {
                    respuesta += `• <strong>${p.nombre}</strong>: $${p.precio}<br>`;
                    respuesta += `  ${p.descripcion}<br><br>`;
                });
                return respuesta;
            }

            if (this.contienePalabras(mensajeLower, chatbot.palabrasClave.gps)) {
                const gps = productos.filter(p => p.categoria === 'buscahuellas');
                let respuesta = 'Rastreo GPS sin mensualidad:<br><br>';
                gps.forEach(p => {
                    respuesta += `• <strong>${p.nombre}</strong>: $${p.precio}${p.promocion ? ' (OFERTA)' : ''}<br>`;
                    respuesta += `  ${p.descripcion}<br><br>`;
                });
                return respuesta;
            }

            if (this.contienePalabras(mensajeLower, chatbot.palabrasClave.audio)) {
                const audio = productos.filter(p => p.categoria === 'audio');
                let respuesta = ' Sistemas de audio premium:<br><br>';
                audio.slice(0, 4).forEach(p => {
                    respuesta += `• <strong>${p.nombre}</strong>: $${p.precio}<br>`;
                    respuesta += `  ${p.descripcion}<br><br>`;
                });
                return respuesta;
            }

            if (this.contienePalabras(mensajeLower, chatbot.palabrasClave.led)) {
                const led = productos.filter(p => p.categoria === 'led');
                let respuesta = ' Iluminacion LED profesional:<br><br>';
                led.forEach(p => {
                    respuesta += `• <strong>${p.nombre}</strong>: $${p.precio}<br>`;
                    respuesta += `  ${p.descripcion}<br><br>`;
                });
                return respuesta;
            }

            if (this.contienePalabras(mensajeLower, chatbot.palabrasClave.precios)) {
                return `Tenemos precios muy competitivos! Algunos ejemplos:<br><br>
                    • Polarizado: Desde $120<br>
                    • GPS: Desde $150<br>
                    • Alarma: Desde $280<br>
                    • Radio: Desde $280<br>
                    • LED: Desde $80<br><br>
                    Cual producto te interesa?`;
            }

            if (this.contienePalabras(mensajeLower, chatbot.palabrasClave.promociones)) {
                let respuesta = 'Promociones activas:<br><br>';
                promociones.forEach(p => {
                    respuesta += `• <strong>${p.titulo}</strong>: ${p.descuento} de descuento<br>`;
                    respuesta += `  ${p.descripcion}<br><br>`;
                });
                return respuesta;
            }

            if (this.contienePalabras(mensajeLower, chatbot.palabrasClave.garantia)) {
                return 'Todos nuestros productos tienen garantia del fabricante! '
                    + 'Ademas damos garantia de instalacion. '
                    + 'El polarizado tiene hasta 5 anos de garantia, '
                    + 'las alarmas y GPS tienen 1-2 anos segun el modelo.';
            }

            if (this.contienePalabras(mensajeLower, chatbot.palabrasClave.instalacion)) {
                const servicios = this.datos.servicios;
                let respuesta = 'Nuestros servicios de instalacion:<br><br>';
                servicios.forEach(s => {
                    respuesta += `• <strong>${s.nombre}</strong>: $${s.precio}<br>`;
                    respuesta += `  Tiempo estimado: ${s.tiempo}<br><br>`;
                });
                return respuesta;
            }

            for (const item of faq) {
                if (mensajeLower.includes(item.pregunta.toLowerCase().split(' ')[0]) || 
                    item.pregunta.toLowerCase().split(' ').some(p => mensajeLower.includes(p))) {
                    return item.respuesta;
                }
            }

            return chatbot.respuestasDefault.Default;
        },

        contienePalabras(texto, palabras) {
            return palabras.some(palabra => texto.includes(palabra));
        }
    };

    document.addEventListener('DOMContentLoaded', () => App.init());

    window.App = App;
})();