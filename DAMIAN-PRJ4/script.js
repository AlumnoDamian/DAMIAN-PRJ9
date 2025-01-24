$(document).ready(function() {
    const hanoi = {
        torres: [[], [], []],
        movs: 0,
        enJuego: false,
        enPausa: false,
        discoSel: null,
        tiempoIni: null,
        tiempoPausa: null,
        intervalo: null,
        mejorTiempo: parseFloat(localStorage.getItem('mejorTiempo')) || Infinity,
        colores: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
        tiempoAcum: 0,

        iniciarJuego: function(numDiscos) {
            this.torres = [[], [], []];
            for (let disco = numDiscos; disco > 0; disco--) {
                this.torres[0].push(disco);
            }
            this.movs = 0;
            this.enJuego = false;
            this.enPausa = false;
            this.discoSel = null;
            this.tiempoIni = null;
            this.tiempoPausa = null;
            this.tiempoAcum = 0;
            this.actualizarMejorTiempo();
            this.renderizarTorres();
            this.empezarJuego();

            const movimientosMinimos = this.calcularMovimientosMinimos(numDiscos);
            $('#movimientosMinimos').text(`Movimientos mínimos: ${movimientosMinimos}`);
            this.actualizarContadorMovimientos();
        },

        renderizarTorres: function() {
            const totalDiscos = this.torres[0].length + this.torres[1].length + this.torres[2].length;
            for (let torre = 0; torre < 3; torre++) {
                $(`#torre${torre + 1}`).empty();
                for (let disco = 0; disco < this.torres[torre].length; disco++) {
                    const tamañoDisco = this.torres[torre][disco];
                    const anchoDisco = (tamañoDisco / totalDiscos) * 280;
                    $('<div>')
                        .addClass('disco')
                        .css({
                            width: `${anchoDisco}px`,
                            backgroundColor: this.colores[tamañoDisco % this.colores.length],
                            bottom: `${disco * 35}px`
                        })
                        .attr({
                            'data-torre': torre,
                            'data-disco': tamañoDisco
                        })
                        .appendTo(`#torre${torre + 1}`);
                }
            }
        },

        clickDisco: function(event) {
            if (!this.enJuego || this.enPausa) return;

            const elementoClicado = $(event.target);
            const torreCercana = elementoClicado.closest('.torre');
            const indiceTorre = parseInt(torreCercana.data('indice'));

            if (this.discoSel == null) {
                if (elementoClicado.hasClass('disco') && elementoClicado.is(':last-child')) {
                    this.discoSel = elementoClicado;
                    this.discoSel.css('opacity', '0.6');
                }
            } else {
                const torreOrigen = parseInt(this.discoSel.data('torre'));
                const tamañoDisco = parseInt(this.discoSel.data('disco'));

                if (this.movimientoValido(torreOrigen, indiceTorre, tamañoDisco)) {
                    this.moverDisco(torreOrigen, indiceTorre);
                    this.movs++;
                    this.actualizarContadorMovimientos();
                    this.renderizarTorres();
                    this.verificarVictoria();
                }

                this.discoSel.css('opacity', '1');
                this.discoSel = null;
            }
        },

        movimientoValido: function(torreOrigen, torreDestino, tamañoDisco) {
            if (torreOrigen == torreDestino) return false;
            if (this.torres[torreDestino].length == 0) return true;
            return tamañoDisco < this.torres[torreDestino][this.torres[torreDestino].length - 1];
        },

        moverDisco: function(torreOrigen, torreDestino) {
            const disco = this.torres[torreOrigen].pop();
            this.torres[torreDestino].push(disco);
        },

        verificarVictoria: function() {
            if (this.torres[2].length == this.torres[0].length + this.torres[1].length + this.torres[2].length) {
                this.enJuego = false;
                clearInterval(this.intervalo);
                const tiempoFin = new Date();
                const diferenciaTiempo = (tiempoFin - this.tiempoIni) / 1000;
                const tiempoTotal = this.tiempoAcum + diferenciaTiempo;

                if (tiempoTotal < this.mejorTiempo) {
                    this.mejorTiempo = tiempoTotal;
                    localStorage.setItem('mejorTiempo', this.mejorTiempo);
                    this.actualizarMejorTiempo();
                }

                this.mostrarMensaje(`¡Felicidades! Completaste el juego en ${this.movs} movimientos y ${this.formatearTiempo(tiempoTotal)}.`);
            }
        },

        actualizarTiempo: function() {
            if (!this.enPausa) {
                const tiempoActual = new Date();
                const diferenciaTiempo = (tiempoActual - this.tiempoIni) / 1000 + this.tiempoAcum;
                $('#temporizador').text(`Tiempo: ${this.formatearTiempo(diferenciaTiempo)}`);
            }
        },

        formatearTiempo: function(segundos) {
            const minutos = Math.floor(segundos / 60);
            const segRestantes = Math.floor(segundos % 60);
            return `${minutos.toString().padStart(2, '0')}:${segRestantes.toString().padStart(2, '0')}`;
        },

        actualizarMejorTiempo: function() {
            $('#mejorTiempo').text(`Mejor tiempo: ${this.mejorTiempo == Infinity ? '--:--' : this.formatearTiempo(this.mejorTiempo)}`);
        },

        guardarJuego: function() {
            if (!this.enJuego) {
                this.mostrarMensaje('No se puede guardar el juego hasta que comiences una partida.');
                return;
            }

            const nombre = localStorage.getItem('nombreJugador');
            const tiempoActual = new Date();
            const diferenciaTiempo = (tiempoActual - this.tiempoIni) / 1000;
            const tiempoTotal = this.tiempoAcum + (this.enPausa ? 0 : diferenciaTiempo);

            const estado = {
                nombre: nombre,
                torres: this.torres,
                movs: this.movs,
                tiempoTotal: tiempoTotal,
                tiempoGuardar: this.formatearTiempo(tiempoTotal),
                enPausa: this.enPausa
            };

            localStorage.setItem('juegoGuardado', JSON.stringify(estado));
            this.mostrarMensaje('Juego guardado.');
        },

        cargarJuego: function() {
            const juegoGuardado = JSON.parse(localStorage.getItem('juegoGuardado'));

            if (juegoGuardado) {
                if (juegoGuardado.nombre) {
                    $('#nombreJugador').val(juegoGuardado.nombre);
                }

                this.torres = juegoGuardado.torres;
                this.movs = juegoGuardado.movs;
                this.tiempoAcum = juegoGuardado.tiempoTotal;
                this.enPausa = juegoGuardado.enPausa;

                const totalDiscos = this.torres[0].length + this.torres[1].length + this.torres[2].length;
                $('#numDiscos').val(totalDiscos);

                this.renderizarTorres();
                this.actualizarContadorMovimientos();
                this.enJuego = true;
                clearInterval(this.intervalo);

                if (!this.enPausa) {
                    this.tiempoIni = new Date();
                    this.intervalo = setInterval(() => this.actualizarTiempo(), 1000);
                } else {
                    this.tiempoPausa = new Date();
                    this.tiempoAcum -= (this.tiempoPausa - this.tiempoIni) / 1000;
                }

                this.actualizarMejorTiempo();
                this.mostrarMensaje('Juego cargado.');
            } else {
                this.mostrarMensaje('No hay juego guardado.');
            }
        },

        reiniciarJuego: function() {
            const nombreJugador = localStorage.getItem('nombreJugador');
            const numDiscos = parseInt($('#numDiscos').val());
            
            this.iniciarJuego(numDiscos);
            this.movs = 0;
            this.actualizarContadorMovimientos();
            this.mostrarMensaje(`¡Juego reiniciado, ${nombreJugador}!`);
        },

        pausarJuego: function() {
            if (this.enJuego) {
                this.enPausa = true;
                clearInterval(this.intervalo);
                this.tiempoPausa = new Date();
                this.tiempoAcum += (this.tiempoPausa - this.tiempoIni) / 1000;
                this.mostrarMensaje('Juego pausado.');
            } else {
                this.mostrarMensaje('No se puede pausar hasta que comience la partida.');
            }
        },

        reanudarJuego: function() {
            if (this.enJuego && this.enPausa) {
                this.enPausa = false;
                this.tiempoIni = new Date();
                this.intervalo = setInterval(() => this.actualizarTiempo(), 1000);
                this.mostrarMensaje('Juego reanudado.');
            } else if (!this.enJuego) {
                this.mostrarMensaje('No se puede reanudar hasta que comience la partida.');
            }
        },

        actualizarContadorMovimientos: function() {
            $('#contadorMovimientos').text(`Movimientos: ${this.movs}`);
        },

        calcularMovimientosMinimos: function(numDiscos) {
            return Math.pow(2, numDiscos) - 1;
        },

        mostrarMensaje: function(texto) {
            $('#mensaje').text(texto).show();
        },

        empezarJuego: function() {
            this.enJuego = true;
            this.enPausa = false;
            this.tiempoIni = new Date();
            this.intervalo = setInterval(() => this.actualizarTiempo(), 1000);
            this.mostrarMensaje('¡Juego comenzado!');
        }
    };

    hanoi.actualizarMejorTiempo();

    $('#areaJuego').on('click', (event) => hanoi.clickDisco(event));
    $('#botonGuardar').on('click', () => hanoi.guardarJuego());
    $('#botonCargar').on('click', () => hanoi.cargarJuego());
    $('#botonReiniciar').on('click', () => hanoi.reiniciarJuego());
    $('#botonPausar').on('click', () => hanoi.pausarJuego());
    $('#botonReanudar').on('click', () => hanoi.reanudarJuego());

    $('#botonGuardarNombre').on('click', () => {
        const nombreJugador = $('#nombreJugador').val();
        const numDiscos = parseInt($('#numDiscos').val());

        if (nombreJugador.trim() == '' || isNaN(numDiscos) || numDiscos < 3 || numDiscos > 3) {
            hanoi.mostrarMensaje('Por favor, ingresa un nombre y coloca 3 discos para empezar.');
            return;
        }

        localStorage.setItem('nombreJugador', nombreJugador);
        hanoi.iniciarJuego(numDiscos);
        hanoi.mostrarMensaje(`¡Juego iniciado, ${nombreJugador}!`);
    });

    hanoi.actualizarContadorMovimientos();
});