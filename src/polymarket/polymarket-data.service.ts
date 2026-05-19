import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../config/configuration';
import { PolymarketPositionDto } from './types/position.types';

@Injectable()
export class PolymarketDataService {
  private readonly logger = new Logger(PolymarketDataService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async fetchPositions(): Promise<PolymarketPositionDto[]> {
    const baseUrl = this.config.get('dataApiBaseUrl', { infer: true });
    const user = this.config.get('positionsUserAddress', { infer: true });
    const url = `${baseUrl}/positions`;

    try {
      const { data } = await firstValueFrom(
        this.http.get<PolymarketPositionDto[]>(url, {
          params: { user },
          timeout: 15_000,
        }),
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      this.logger.error(
        `Failed to fetch positions: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}
