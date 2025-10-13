import { useState, useMemo } from 'react';

export interface SemanaInfo {
  fechaInicio: Date;
  fechaFin: Date;
  numeroSemana: number;
  año: number;
  esSemanaActual: boolean;
  esSemanaPasada: boolean;
  esSemanaFutura: boolean;
  dias: DiaSemana[];
}

export interface DiaSemana {
  fecha: Date;
  nombre: string;
  numero: number;
  esHoy: boolean;
  esPasado: boolean;
  esFuturo: boolean;
  esFinDeSemana: boolean;
}

export const useProgramacionSemanal = () => {
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<number>(0); // 0 = actual, -1 = anterior, 1 = próxima

  // Función para obtener el lunes de una semana específica
  const getLunesDeSemana = (fecha: Date): Date => {
    const lunes = new Date(fecha);
    const dia = lunes.getDay();
    const diff = lunes.getDate() - dia + (dia === 0 ? -6 : 1); // Ajustar para que lunes sea 1
    lunes.setDate(diff);
    lunes.setHours(0, 0, 0, 0);
    return lunes;
  };

  // Función para obtener el domingo de una semana específica
  const getDomingoDeSemana = (lunes: Date): Date => {
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);
    return domingo;
  };

  // Función para obtener el número de semana del año
  const getNumeroSemana = (fecha: Date): number => {
    const inicioAño = new Date(fecha.getFullYear(), 0, 1);
    const diasTranscurridos = Math.floor((fecha.getTime() - inicioAño.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((diasTranscurridos + inicioAño.getDay() + 1) / 7);
  };

  // Función para formatear fecha
  const formatearFecha = (fecha: Date): string => {
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Función para formatear rango de fechas
  const formatearRangoFechas = (inicio: Date, fin: Date): string => {
    const inicioStr = inicio.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    const finStr = fin.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${inicioStr} - ${finStr}`;
  };

  // Calcular información de la semana seleccionada
  const semanaInfo: SemanaInfo = useMemo(() => {
    const hoy = new Date();
    const lunesActual = getLunesDeSemana(hoy);
    
    // Calcular la semana seleccionada
    const lunesSeleccionado = new Date(lunesActual);
    lunesSeleccionado.setDate(lunesActual.getDate() + (semanaSeleccionada * 7));
    
    const domingoSeleccionado = getDomingoDeSemana(lunesSeleccionado);
    const numeroSemana = getNumeroSemana(lunesSeleccionado);
    const año = lunesSeleccionado.getFullYear();
    
    // Determinar el tipo de semana
    const esSemanaActual = semanaSeleccionada === 0;
    const esSemanaPasada = semanaSeleccionada < 0;
    const esSemanaFutura = semanaSeleccionada > 0;
    
    // Generar días de la semana
    const dias: DiaSemana[] = [];
    const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(lunesSeleccionado);
      fecha.setDate(lunesSeleccionado.getDate() + i);
      
      const esHoy = fecha.toDateString() === hoy.toDateString();
      const esPasado = fecha < hoy && !esHoy;
      const esFuturo = fecha > hoy;
      const esFinDeSemana = i >= 5; // Sábado y domingo
      
      dias.push({
        fecha,
        nombre: nombresDias[i],
        numero: fecha.getDate(),
        esHoy,
        esPasado,
        esFuturo,
        esFinDeSemana
      });
    }
    
    return {
      fechaInicio: lunesSeleccionado,
      fechaFin: domingoSeleccionado,
      numeroSemana,
      año,
      esSemanaActual,
      esSemanaPasada,
      esSemanaFutura,
      dias
    };
  }, [semanaSeleccionada]);

  // Navegación entre semanas
  const irASemanaAnterior = () => {
    setSemanaSeleccionada(prev => prev - 1);
  };

  const irASemanaActual = () => {
    setSemanaSeleccionada(0);
  };

  const irASemanaSiguiente = () => {
    setSemanaSeleccionada(prev => prev + 1);
  };

  const irASemanaEspecifica = (offset: number) => {
    setSemanaSeleccionada(offset);
  };

  // Obtener etiqueta de la semana
  const getEtiquetaSemana = (): string => {
    if (semanaInfo.esSemanaActual) {
      return 'Semana Actual';
    } else if (semanaInfo.esSemanaPasada) {
      const semanasAtras = Math.abs(semanaSeleccionada);
      return semanasAtras === 1 ? 'Semana Anterior' : `${semanasAtras} Semanas Atrás`;
    } else {
      const semanasAdelante = semanaSeleccionada;
      return semanasAdelante === 1 ? 'Próxima Semana' : `${semanasAdelante} Semanas Adelante`;
    }
  };

  // Obtener rango de fechas formateado
  const getRangoFechasFormateado = (): string => {
    return formatearRangoFechas(semanaInfo.fechaInicio, semanaInfo.fechaFin);
  };

  return {
    semanaInfo,
    semanaSeleccionada,
    irASemanaAnterior,
    irASemanaActual,
    irASemanaSiguiente,
    irASemanaEspecifica,
    getEtiquetaSemana,
    getRangoFechasFormateado,
    formatearFecha
  };
};
