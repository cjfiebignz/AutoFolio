export interface Vehicle {
  id: string;
  userId: string;
  specId: string;
  vin: string;
  licensePlate: string;
  nickname: string;
  status: 'active' | 'inactive' | 'sold';
  createdAt: string;
  attributes: any[];
  registrations: any[];
  insurance: any[];
  services?: any[];
  workJobs?: any[];
}

export interface VehicleSpecs {
  vehicle: {
    specID: string;
    specSlug: string;
    make: string;
    model: string;
    generation: string;
    variant: string;
    engine: string;
    drivetrain: string;
    transmission: string;
  };
  specs: {
    fluids: Array<{
      fluidType: string;
      capacityLitres: number;
      specCode: string;
    }>;
    torque: Array<{
      label: string;
      torqueNm: number;
    }>;
    parts: Array<{
      partType: string;
      brand: string;
      partNumber: string;
      isOem: boolean;
      notes: string | null;
    }>;
  };
}

export interface VehicleWithSpecs {
  vehicle: Vehicle;
  specs: VehicleSpecs;
}
