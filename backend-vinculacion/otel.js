const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');

let telemetryStarted = false;
let sdk = null;

const initializeTelemetry = async () => {
  if (telemetryStarted) {
    return;
  }

  telemetryStarted = true;

  // Set default service name if not provided
  process.env.OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'finca-lodana-backend';

  try {
    // Configure the OTLP/HTTP protobuf trace exporter.
    // If OTEL_EXPORTER_OTLP_ENDPOINT is defined in the environment (e.g. by .NET Aspire),
    // the OTLPTraceExporter automatically uses it. Otherwise, we fall back to localhost.
    const exporterOptions = {};
    if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      exporterOptions.url = 'http://localhost:4318/v1/traces';
    }

    const traceExporter = new OTLPTraceExporter(exporterOptions);

    sdk = new NodeSDK({
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Auto-instrument express, pg, http, etc.
          '@opentelemetry/instrumentation-express': {
            enabled: true,
          },
          '@opentelemetry/instrumentation-pg': {
            enabled: true,
          },
        }),
      ],
    });

    await sdk.start();
    console.log(`[OTel] Telemetría inicializada para el servicio: ${process.env.OTEL_SERVICE_NAME}`);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.warn('[OTel Warning] OpenTelemetry no está completamente instalado. Continuando sin telemetría.');
      return;
    }
    console.warn(`[OTel Warning] No fue posible inicializar OpenTelemetry: ${error.message}`);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  if (sdk) {
    sdk.shutdown()
      .then(() => console.log('[OTel] SDK de OpenTelemetry finalizado correctamente.'))
      .catch((error) => console.error('[OTel Error] Error al finalizar SDK de OpenTelemetry:', error))
      .finally(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

void initializeTelemetry();

module.exports = {
  initializeTelemetry,
};