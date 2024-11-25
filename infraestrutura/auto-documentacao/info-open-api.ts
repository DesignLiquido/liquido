import { LicenseOpenApi } from "./license-open-api";

export interface InfoOpenApi {
    description: string;
    version: string;
    title: string;
    license: LicenseOpenApi;
}
