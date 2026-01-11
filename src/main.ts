const processMap: Record<string, () => Promise<void>> = {
  api: () => import('./bootstrap/api.bootstrap.js').then(m => m.bootstrapApi()),
  worker: () =>
    import('./bootstrap/worker.bootstrap.js').then(m => m.bootstrapWorker()),
};

async function bootstrap() {
  const processType = process.argv[2];

  if (!processType || !processMap[processType]) {
    throw new Error(
      `Invalid process type. Use one of: ${Object.keys(processMap).join(', ')}`
    );
  }

  await processMap[processType]();
}

bootstrap();
