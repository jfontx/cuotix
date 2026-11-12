import 'dotenv/config';

import { createApp } from './app';
import { runAllJobs, scheduleJobs } from './jobs';

const port = Number(process.env.PORT ?? 3000);

createApp().listen(port, () => {
  console.log(`Cuotix API escuchando en el puerto ${port}`);
});

scheduleJobs();
// Al arrancar (demos, o si el servidor estuvo apagado); un fallo no debe tumbar el servidor
runAllJobs().catch((err) => console.error('Falló la ejecución inicial de los jobs', err));
