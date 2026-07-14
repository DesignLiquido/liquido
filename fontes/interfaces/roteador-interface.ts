export interface RoteadorInterface {
    ativarDesativarCors(valor: boolean): void;
    configurarOrigensCors(origem: string): void;
    ativarDesativarPassport(valor: boolean): void;
    ativarDesativarCookieParser(valor: boolean): void;
    ativarDesativarExpressJson(valor: boolean): void;
    ativarDesativarBodyParser(valor: boolean): void;
    ativarDesativarHelmet(valor: boolean): void;
    ativarDesativarMorgan(valor: boolean): void;
    configurarArquivosEstaticos(diretorio: string): void;
}
