// Función para exportar la planificación semanal a PDF
export const exportarPlanificacionPDF = async (
  fechaInicio: Date,
  asignaciones: any[]
) => {
  try {
    // Debug: Log de datos recibidos
    console.log('🔍 PDF Exporter - Fecha inicio:', fechaInicio);
    console.log('🔍 PDF Exporter - Asignaciones recibidas:', asignaciones);
    console.log('🔍 PDF Exporter - Total asignaciones:', asignaciones.length);
    
    // Importar jsPDF dinámicamente
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    
    // Crear contenido HTML para el PDF
    const contenidoHTML = generarHTMLPlanificacion(fechaInicio, asignaciones);
    console.log('🔍 PDF Exporter - HTML generado:', contenidoHTML.substring(0, 500) + '...');
    
    // Crear un elemento temporal para renderizar el HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = contenidoHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.backgroundColor = 'white';
    document.body.appendChild(tempDiv);
    
    // Convertir HTML a canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    // Crear PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    // Calcular dimensiones para ajustar al A4
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;
    
    // Agregar imagen al PDF
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    // Generar nombre del archivo con fecha
    const fechaFormateada = fechaInicio.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    
    // Descargar PDF
    pdf.save(`Planificacion_Semanal_${fechaFormateada}.pdf`);
    
    // Limpiar elemento temporal
    document.body.removeChild(tempDiv);
    
  } catch (error) {
    console.error('Error al generar PDF:', error);
    
    // Fallback: descargar como HTML
    const contenidoHTML = generarHTMLPlanificacion(fechaInicio, asignaciones);
    const blob = new Blob([contenidoHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const fechaFormateada = fechaInicio.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    
    link.download = `Planificacion_Semanal_${fechaFormateada}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Error al generar PDF. Se ha descargado como archivo HTML. Puedes abrirlo e imprimirlo como PDF.');
  }
};

const generarHTMLPlanificacion = (fechaInicio: Date, asignaciones: any[]) => {
  console.log('🔍 GenerarHTML - Fecha inicio:', fechaInicio);
  console.log('🔍 GenerarHTML - Asignaciones:', asignaciones);
  
  const diasSemana = [
    { value: 'LUN', label: 'Lunes' },
    { value: 'MAR', label: 'Martes' },
    { value: 'MIE', label: 'Miércoles' },
    { value: 'JUE', label: 'Jueves' },
    { value: 'VIE', label: 'Viernes' },
    { value: 'SAB', label: 'Sábado' },
    { value: 'DOM', label: 'Domingo' }
  ];

  // Obtener fechas de la semana
  const getFechasSemana = (fechaInicio: Date) => {
    const fechas = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(fechaInicio);
      fecha.setDate(fechaInicio.getDate() + i);
      fechas.push(fecha);
    }
    return fechas;
  };

  const fechasSemana = getFechasSemana(fechaInicio);
  console.log('🔍 GenerarHTML - Fechas semana:', fechasSemana);

  // Obtener personal único
  const getPersonalUnico = () => {
    const personalSet = new Set(asignaciones.map((a: any) => a.personalId));
    const personalUnico = Array.from(personalSet).map(personalId => {
      const asignacion = asignaciones.find((a: any) => a.personalId === personalId);
      return {
        id: personalId,
        nombre: asignacion?.personalNombre || 'Personal no encontrado'
      };
    });
    console.log('🔍 GenerarHTML - Personal único:', personalUnico);
    return personalUnico;
  };

  const personalUnico = getPersonalUnico();

  // Obtener asignaciones por día
  const getAsignacionesPorDia = (dia: string) => {
    const asignacionesDia = asignaciones.filter((asignacion: any) => asignacion.dia === dia);
    console.log(`🔍 GenerarHTML - Asignaciones para ${dia}:`, asignacionesDia);
    return asignacionesDia;
  };

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Planificación Semanal</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .table-container {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th {
          background-color: #f8f9fa;
          color: #495057;
          font-weight: 600;
          text-align: center;
          padding: 15px 8px;
          border: 1px solid #dee2e6;
          vertical-align: middle;
        }
        th.personal-column {
          background-color: #e9ecef;
          text-align: left;
          width: 120px;
          position: sticky;
          left: 0;
          z-index: 10;
        }
        td {
          padding: 8px;
          border: 1px solid #dee2e6;
          vertical-align: top;
          min-height: 60px;
        }
        td.personal-cell {
          background-color: #f8f9fa;
          font-weight: 500;
          position: sticky;
          left: 0;
          z-index: 5;
        }
        .asignacion {
          background-color: #e3f2fd;
          border: 1px solid #bbdefb;
          border-radius: 4px;
          padding: 6px;
          margin-bottom: 4px;
          font-size: 10px;
        }
        .asignacion:last-child {
          margin-bottom: 0;
        }
        .servicio-nombre {
          font-weight: 600;
          color: #1565c0;
          margin-bottom: 2px;
        }
        .horario {
          color: #424242;
          margin-bottom: 2px;
        }
        .lugar {
          color: #666;
          font-size: 9px;
        }
        .cliente {
          color: #666;
          font-size: 9px;
          font-style: italic;
        }
        .sin-asignaciones {
          text-align: center;
          color: #999;
          font-style: italic;
          padding: 20px;
        }
        .resumen {
          background-color: #f8f9fa;
          padding: 20px;
          border-top: 1px solid #dee2e6;
        }
        .resumen h3 {
          margin: 0 0 15px 0;
          color: #495057;
          font-size: 18px;
        }
        .resumen-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }
        .stat-item {
          background: white;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }
        .stat-label {
          font-size: 12px;
          color: #6c757d;
          margin-bottom: 5px;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: #495057;
        }
        @media print {
          body {
            background-color: white;
            padding: 0;
          }
          .container {
            box-shadow: none;
            border-radius: 0;
          }
          .header {
            background: #667eea !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          th, td {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Planificación Semanal</h1>
          <p>${fechaInicio.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          })} - ${fechasSemana[6].toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          })}</p>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th class="personal-column">Personal</th>
                ${diasSemana.map((dia, index) => `
                  <th>
                    <div>${dia.label}</div>
                    <div style="font-size: 10px; font-weight: normal; margin-top: 2px;">
                      ${fechasSemana[index].getDate()}
                    </div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${personalUnico.map(personal => `
                <tr>
                  <td class="personal-cell">${personal.nombre}</td>
                  ${diasSemana.map(dia => {
                    const asignacionesDia = getAsignacionesPorDia(dia.value)
                      .filter((a: any) => a.personalId === personal.id);
                    
                    return `
                      <td>
                        ${asignacionesDia.length > 0 ? 
                          asignacionesDia.map((asignacion: any) => `
                            <div class="asignacion">
                              <div class="servicio-nombre">${asignacion.servicioNombre}</div>
                              <div class="horario">${asignacion.horaInicio} - ${asignacion.horaFin}</div>
                              <div class="lugar">📍 ${asignacion.lugar}</div>
                              <div class="cliente">👤 ${asignacion.cliente}</div>
                            </div>
                          `).join('') :
                          '<div class="sin-asignaciones">Sin asignaciones</div>'
                        }
                      </td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="resumen">
          <h3>📊 Resumen de la Semana</h3>
          <div class="resumen-stats">
            <div class="stat-item">
              <div class="stat-label">Total de Asignaciones</div>
              <div class="stat-value">${asignaciones.length}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Personal Asignado</div>
              <div class="stat-value">${personalUnico.length}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Servicios Únicos</div>
              <div class="stat-value">${new Set(asignaciones.map((a: any) => a.servicioId)).size}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Clientes Atendidos</div>
              <div class="stat-value">${new Set(asignaciones.map((a: any) => a.cliente)).size}</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
