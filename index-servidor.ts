import { Liquido } from './liquido';

const pontoDeEntradaServidor = async () => {
    const liquido = new Liquido(process.cwd());
    liquido.iniciar();
}

pontoDeEntradaServidor();