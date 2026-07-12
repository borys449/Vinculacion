let telemetryStarted = false;

const initializeTelemetry = async () => {
  if (telemetryStarted) {
    return;
  }

  telemetryStarted = true;

  try {
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-proto');

    const sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
      }),
      instrumentations: [getNodeAutoInstrumentations()],
    });

    await sdk.start();
    console.log('OpenTelemetry inicializado correctamente.');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.warn('OpenTelemetry no está instalado; la aplicación continúa sin telemetría.');
      return;
    }

    console.warn(`No fue posible inicializar OpenTelemetry: ${error.message}`);
  }
};

void initializeTelemetry();

module.exports = {
  initializeTelemetry,
};