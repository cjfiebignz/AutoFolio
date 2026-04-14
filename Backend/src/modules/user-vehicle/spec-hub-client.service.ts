import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  InternalServerErrorException,
  GatewayTimeoutException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { AxiosError } from 'axios';

export interface SpecHubVehicleSummary {
  specID: string;
  specSlug: string;
  make: string;
  model: string;
  generation: string;
  variant: string;
  engine: string;
  drivetrain: string;
  transmission: string;
}

export interface SpecHubFluidItem {
  fluidType: string;
  capacityLitres: number;
  specCode?: string | null;
}

export interface SpecHubTorqueItem {
  label: string;
  torqueNm: number;
}

export interface SpecHubPartItem {
  partType: string;
  brand?: string | null;
  partNumber: string;
  isOem: boolean;
  notes?: string | null;
}

export interface SpecHubGetSpecResponse {
  vehicle: SpecHubVehicleSummary;
  specs: {
    fluids: SpecHubFluidItem[];
    torque: SpecHubTorqueItem[];
    parts: SpecHubPartItem[];
  };
}

@Injectable()
export class SpecHubClientService {
  private readonly logger = new Logger(SpecHubClientService.name);
  private readonly specHubBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.specHubBaseUrl = this.configService.get<string>(
      'SPECHUB_BASE_URL',
      'http://localhost:3000',
    );
  }

  async getSpecs(specId: string): Promise<SpecHubGetSpecResponse> {
    if (!specId) {
      this.logger.warn('SpecHubClientService.getSpecs: Missing specId parameter');
      throw new InternalServerErrorException('Specification ID is required');
    }

    const url = `${this.specHubBaseUrl}/spec/${specId}`;
    this.logger.log(`Fetching SpecHUB data from ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get<SpecHubGetSpecResponse>(url).pipe(
          timeout(5000),
          catchError((error: AxiosError) => {
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
              this.logger.error(`SpecHUB Timeout [${specId}]: Request took longer than 5s`);
              throw new GatewayTimeoutException(
                'External specification service (SpecHUB) timed out',
              );
            }

            if (!error.response) {
              this.logger.error(`SpecHUB Unreachable [${specId}]: ${error.message}`);
              throw new ServiceUnavailableException(
                'External specification service is currently unavailable',
              );
            }

            const status = error.response.status;
            const responseData = error.response.data;

            if (status === 404) {
              this.logger.warn(`SpecHUB 404 [${specId}]: Specification not found`);
              throw new NotFoundException(
                `Vehicle specification '${specId}' not found in registry`,
              );
            }

            this.logger.error(
              `SpecHUB Error [${specId}] Status ${status}: ${error.message} | Response: ${JSON.stringify(responseData)}`,
            );
            throw new InternalServerErrorException(
              `External registry error: ${error.message}`,
            );
          }),
        ),
      );

      const data = response.data;

      if (
        !data ||
        typeof data !== 'object' ||
        !data.vehicle ||
        !data.specs ||
        !data.vehicle.specID ||
        !data.vehicle.make ||
        !Array.isArray(data.specs.fluids) ||
        !Array.isArray(data.specs.torque) ||
        !Array.isArray(data.specs.parts)
      ) {
        this.logger.error(
          `SpecHUB Malformed Response [${specId}]: ${JSON.stringify(data)}`,
        );
        throw new InternalServerErrorException(
          'External registry returned a malformed response',
        );
      }

      return data;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ServiceUnavailableException ||
        error instanceof GatewayTimeoutException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Unknown client error';

      this.logger.error(`SpecHUB Unexpected Client Error [${specId}]: ${message}`);
      throw new InternalServerErrorException(
        'An unexpected error occurred while fetching external specifications',
      );
    }
  }
}
