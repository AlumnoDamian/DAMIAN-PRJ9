$(document).ready(function() {
    function Avion(nombreCompañia, precioBase, numeroFilas, numeroColumnas) {
        this.nombreCompañia = nombreCompañia;
        this.precioBase = precioBase;
        this.numeroFilas = numeroFilas;
        this.numeroColumnas = numeroColumnas;
        this.colorAsiento = [];
    }

    window.binter = new Avion("Binter", 120, 21, 8);
    window.ryanair = new Avion("Ryanair", 85, 32, 6);
    window.iberia = new Avion("Iberia", 160, 26, 5);

    let totalPrecio = 0;
    let asientosSeleccionados = [];
    let asientosGuardados = [];

    function tablaAsientos(avion) {
        const $container = $('#asientos-container');
        $container.empty();

        const totalFilas = avion.numeroFilas;
        const businessFilas = Math.ceil(totalFilas * 0.1);
        const economicaFilas = Math.ceil((totalFilas - businessFilas) / 2);

        const colorGuardado = localStorage.getItem(avion.nombreCompañia + "ColorAsiento");
        
        if (colorGuardado) {
            avion.colorAsiento = JSON.parse(colorGuardado);
        } else {
            generarColor(avion, totalFilas, businessFilas, economicaFilas);
            localStorage.setItem(avion.nombreCompañia + "ColorAsiento", JSON.stringify(avion.colorAsiento));
        }

        const asientosConfirmados = JSON.parse(sessionStorage.getItem(avion.nombreCompañia + "AsientosConfirmados")) || [];
        asientosGuardados = [...asientosConfirmados];

        // Create sections
        const $businessSection = $('<div>').addClass('seccion-asientos business-section');
        const $economySection = $('<div>').addClass('seccion-asientos economica-section');
        const $lowcostSection = $('<div>').addClass('seccion-asientos lowcost-section');

        // Add titles
        $businessSection.append($('<div>').addClass('seccion-titulo').text('Clase Business'));
        $economySection.append($('<div>').addClass('seccion-titulo').text('Clase económica'));
        $lowcostSection.append($('<div>').addClass('seccion-titulo').text('Low Cost'));

        // Create rows for each section
        for (let fila = 0; fila < totalFilas; fila++) {
            const $filaDiv = $('<div>').addClass('fila-asientos');
            
            for (let columna = 0; columna < avion.numeroColumnas; columna++) {
                const $asiento = celdaAsiento(avion, fila, columna);
                $filaDiv.append($asiento);
            }

            if (fila < businessFilas) {
                $businessSection.append($filaDiv);
            } else if (fila < businessFilas + economicaFilas) {
                $economySection.append($filaDiv);
            } else {
                $lowcostSection.append($filaDiv);
            }
        }

        $container
            .append($businessSection)
            .append($economySection)
            .append($lowcostSection);
    }

    function generarColor(avion, totalFilas, businessFilas, economicaFilas) {
        for (let fila = 0; fila < totalFilas; fila++) {
            avion.colorAsiento[fila] = [];
            for (let columna = 0; columna < avion.numeroColumnas; columna++) {
                let tipo;
                if (fila < businessFilas) {
                    tipo = Math.random() < 0.5 ? 'ocupado' : 'business';
                } else if (fila < businessFilas + economicaFilas) {
                    tipo = Math.random() < 0.5 ? 'ocupado' : 'economica';
                } else {
                    tipo = Math.random() < 0.5 ? 'ocupado' : 'lowcost';
                }
                avion.colorAsiento[fila][columna] = tipo;
            }
        }
    }

    function celdaAsiento(avion, fila, columna) {
        const $asiento = $('<div>').addClass('asiento');
        $asiento.text(`${fila + 1}-${columna + 1}`);

        const tipo = avion.colorAsiento[fila][columna];
        $asiento.addClass(tipo);

        if (asientosGuardados.includes($asiento.text()) || tipo === 'ocupado') {
            $asiento.addClass('ocupado');
        } else {
            eventosClick($asiento, avion);
        }

        return $asiento;
    }

    function eventosClick($asiento, avion) {
        $asiento.on('click', () => manejarSeleccion($asiento, avion));
    }

    function guardarAsientos(nombreAvion) {
        const asientosConfirmados = JSON.parse(sessionStorage.getItem(nombreAvion + "AsientosConfirmados")) || [];
        asientosConfirmados.push(...asientosSeleccionados);
        sessionStorage.setItem(nombreAvion + "AsientosConfirmados", JSON.stringify(asientosConfirmados));
        
        asientosSeleccionados = [];
        totalPrecio = 0;
        actualizarPrecio();

        $('.asiento.selected').each(function() {
            $(this).removeClass('selected').addClass('ocupado').off('click');
        });
    }

    function manejarSeleccion($asiento, avion) {
        if ($asiento.hasClass('ocupado')) {
            return;
        }

        const precioPorAsiento = avion.precioBase;

        if ($asiento.hasClass('selected')) {
            $asiento.removeClass('selected');
            totalPrecio -= precioPorAsiento;
            asientosSeleccionados = asientosSeleccionados.filter(a => a !== $asiento.text());
        } else {
            $asiento.addClass('selected');
            totalPrecio += precioPorAsiento;
            asientosSeleccionados.push($asiento.text());
        }

        actualizarPrecio();
        sessionStorage.setItem(avion.nombreCompañia + "AsientosSeleccionados", JSON.stringify(asientosSeleccionados));
    }

    function actualizarPrecio() {
        const cantidadAsientos = asientosSeleccionados.length;
        $('#precio-total').text(`Precio Total: ${totalPrecio}€ (${cantidadAsientos} asientos seleccionados)`);
    }

    window.tablaAsientos = tablaAsientos;
    window.guardarAsientos = guardarAsientos;
    window.actualizarPrecio = actualizarPrecio;
});