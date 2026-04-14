import { VehicleSpecs } from "@/types/autofolio";

export interface MasterSpecViewModel {
  make: string;
  model: string;
  variant: string;
  engine: string;
  transmission: string;
  drivetrain: string;
}

export interface SpecDetailItem {
  label: string;
  value: string;
  subValue?: string;
  isOem?: boolean;
}

export interface SpecsViewModel {
  master: MasterSpecViewModel;
  fluids: SpecDetailItem[];
  torque: SpecDetailItem[];
  parts: SpecDetailItem[];
}

export function mapToSpecsViewModel(raw: VehicleSpecs | null): SpecsViewModel | null {
  if (!raw || !raw.vehicle) {
    return null;
  }

  return {
    master: {
      make: raw.vehicle.make,
      model: raw.vehicle.model,
      variant: raw.vehicle.variant,
      engine: raw.vehicle.engine,
      transmission: raw.vehicle.transmission,
      drivetrain: raw.vehicle.drivetrain,
    },
    fluids: raw.specs.fluids.map(f => ({
      label: f.fluidType,
      value: `${f.capacityLitres}L`,
      subValue: f.specCode
    })),
    torque: raw.specs.torque.map(t => ({
      label: t.label,
      value: `${t.torqueNm}`,
      subValue: 'NM'
    })),
    parts: raw.specs.parts.map(p => ({
      label: p.partType,
      value: p.partNumber,
      subValue: p.brand,
      isOem: p.isOem
    }))
  };
}
