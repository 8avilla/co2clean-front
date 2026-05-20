import { CarbonFootprintData, CarbonFootprintListData, CATEGORIAS, FUENTES } from '../types';
import { CompanyService } from '../../Companies/services/company.service';

const STORAGE_KEY = 'cleanco2_carbon_footprints';

/**
 * Service for handling Carbon Footprint data operations.
 * Uses localStorage to simulate a persistent backend for development.
 */
export class CarbonFootprintService {
  private static getStoredData(): CarbonFootprintData[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : this.getInitialData();
  }

  private static setStoredData(data: CarbonFootprintData[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private static getInitialData(): CarbonFootprintData[] {
    return [
      {
        id: 'fp_1',
        createdAt: new Date().toISOString(),
        empresaId: '1',
        sedeId: '101',
        anio: '2024',
        modoCarga: 'Mensual',
        categoria: 'alcance_1',
        fuente: 'movil',
        subfuente: 'Diesel',
        item: 'ABC-123',
        cantidadConsumida: '450',
        unidad: 'Galones',
        estadoAnalisis: 'Completado'
      },
      {
        id: 'fp_2',
        createdAt: new Date().toISOString(),
        empresaId: '1',
        sedeId: '102',
        anio: '2024',
        modoCarga: 'Anual',
        categoria: 'alcance_2',
        fuente: 'sin',
        subfuente: 'Uso de energía del sistema interconectado nacional',
        item: 'PLANTA-01',
        cantidadConsumida: '12400',
        unidad: 'kWh',
        estadoAnalisis: 'En Progreso'
      },
      {
        id: 'fp_3',
        createdAt: new Date().toISOString(),
        empresaId: '1',
        sedeId: '105',
        anio: '2023',
        modoCarga: 'Anual',
        categoria: 'alcance_1',
        fuente: 'estacionaria',
        subfuente: 'Combustión Estacionaria',
        item: 'CALDERA-01',
        cantidadConsumida: '85',
        unidad: 'm3',
        estadoAnalisis: 'Pendiente'
      }
    ];
  }

  static async getCarbonFootprints(): Promise<CarbonFootprintListData[]> {
    await new Promise(r => setTimeout(r, 500)); // Simulate delay
    const footprints = this.getStoredData();
    const companies = await CompanyService.getCompanies();

    return footprints.map(fp => {
      const company = companies.find(c => c.id === fp.empresaId);
      const branch = company?.headquarters?.find(s => s.id === fp.sedeId);
      const categoria = CATEGORIAS.find(c => c.id === fp.categoria);
      const fuente = FUENTES.find(f => f.id === fp.fuente);

      return {
        ...fp,
        empresaNombre: company?.name || 'Desconocida',
        sedeNombre: branch?.name || 'Desconocida',
        categoriaNombre: categoria?.nombre || 'Desconocida',
        fuenteNombre: fuente?.nombre || 'Desconocida',
      };
    });
  }

  static async getCarbonFootprintById(id: string): Promise<CarbonFootprintData | null> {
    const footprints = this.getStoredData();
    return footprints.find(f => f.id === id) || null;
  }

  static async createCarbonFootprint(data: Omit<CarbonFootprintData, 'id' | 'createdAt'>): Promise<CarbonFootprintData> {
    const footprints = this.getStoredData();
    const newFootprint: CarbonFootprintData = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      estadoAnalisis: data.estadoAnalisis || 'Pendiente'
    };
    this.setStoredData([newFootprint, ...footprints]);
    return newFootprint;
  }

  static async updateCarbonFootprint(id: string, data: Partial<CarbonFootprintData>): Promise<CarbonFootprintData> {
    const footprints = this.getStoredData();
    const index = footprints.findIndex(f => f.id === id);
    if (index === -1) throw new Error('Registro no encontrado');

    footprints[index] = { ...footprints[index], ...data };
    this.setStoredData(footprints);
    return footprints[index];
  }

  static async deleteCarbonFootprint(id: string): Promise<void> {
    const footprints = this.getStoredData();
    this.setStoredData(footprints.filter(f => f.id !== id));
  }
}
