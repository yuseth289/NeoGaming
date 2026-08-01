export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  details: string[];
}

export interface ApiPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuarioId: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface RegistroUsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
}

export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  numeroDocumento: string | null;
  rol: string;
  estado: string;
}

export interface PerfilUsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  numeroDocumento: string | null;
  sobreMi: string | null;
  fotoPerfilUrl: string | null;
  prefiereNoticias: boolean;
  prefiereOfertas: boolean;
  rol: string;
  estado: string;
}

export interface ActualizarPerfilUsuarioRequest {
  nombre: string;
  email: string;
  telefono?: string | null;
  sobreMi?: string | null;
  fotoPerfilUrl?: string;
  prefiereNoticias?: boolean | null;
  prefiereOfertas?: boolean | null;
}

export interface DatosPagoVendedorRequest {
  tipoCuenta: string;
  numeroCuenta: string;
  banco: string;
  titularCuenta: string;
}

export interface ConvertirVendedorRequest {
  nombreCompletoORazonSocial: string;
  tipoDocumento: string;
  numeroDocumento: string;
  pais: string;
  telefono: string;
  correo: string;
  nombreComercial: string;
  aceptaTerminos: boolean;
  datosPago?: DatosPagoVendedorRequest | null;
}

export interface VendedorResponse {
  id: number;
  usuarioId: number;
  rolUsuario: string;
  nombreCompletoORazonSocial: string;
  tipoDocumento: string;
  numeroDocumento: string;
  pais: string;
  telefono: string;
  correo: string;
  nombreComercial: string;
  aceptaTerminos: boolean;
  datosPago: DatosPagoVendedorRequest | null;
}

export interface DireccionUsuarioResponse {
  id: number;
  tipo: 'ENVIO' | 'FACTURACION' | string;
  esPrincipal: boolean;
  pais: string;
  departamento: string | null;
  ciudad: string;
  comuna: string | null;
  codigoPostal: string | null;
  calle: string;
  numero: string;
  referencia: string | null;
  estado: string;
}

export interface CrearDireccionRequest {
  tipo: 'ENVIO' | 'FACTURACION';
  esPrincipal?: boolean;
  pais: string;
  departamento?: string | null;
  ciudad: string;
  comuna?: string | null;
  codigoPostal?: string | null;
  calle: string;
  numero: string;
  referencia?: string | null;
}

export interface ActualizarDireccionRequest extends CrearDireccionRequest {}

export interface AgregarProductoCarritoRequest {
  productoId: number;
  cantidad: number;
}

export interface ActualizarCantidadCarritoRequest {
  cantidad: number;
}

export interface ProductoListadoResponse {
  idProducto: number;
  nombre: string;
  sku: string;
  slug: string;
  precioLista: number;
  precioVigente: number;
  moneda: string;
  stockDisponible: number;
  estado: string;
  nombreCategoria: string;
  nombreVendedor: string;
  urlImagenPrincipal: string | null;
}

export interface ProductoBusquedaResponse {
  idProducto: number;
  nombre: string;
  sku: string;
  slug: string;
  precioLista: number;
  precioVigente: number;
  moneda: string;
  stockDisponible: number;
  nombreCategoria: string;
  urlImagenPrincipal: string | null;
  puntajeRelevancia: number;
}

export interface CategoriaArbolResponse {
  idCategoria: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  subcategorias: CategoriaArbolResponse[];
}

export interface ProductoImagenResponse {
  id: number;
  productoId: number;
  urlImagen: string;
  altText: string | null;
  orden: number;
  principal: boolean;
}

export interface CategoriaProductoResponse {
  id: number;
  nombre: string;
  slug: string;
}

export interface CategoriaResponse {
  id: number;
  categoriaPadreId: number | null;
  nombre: string;
  slug: string;
  descripcion: string | null;
  estado: string;
}

export interface CrearCategoriaRequest {
  categoriaPadreId: number | null;
  nombre: string;
  slug: string;
  descripcion?: string | null;
}

export interface VendedorProductoResponse {
  id: number;
  nombre: string;
  email: string;
}

export interface OfertaVigenteProductoResponse {
  id: number;
  titulo: string;
  descripcion: string;
  porcentajeDesc: number;
  precioOferta: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

export interface ProductoDetalleResponse {
  idProducto: number;
  sku: string;
  slug: string;
  nombre: string;
  descripcion: string;
  moneda: string;
  precioLista: number;
  precioVigente: number;
  stockFisico: number;
  stockReservado: number;
  stockDisponible: number;
  condicion: string;
  estado: string;
  categoria: CategoriaProductoResponse;
  vendedor: VendedorProductoResponse;
  imagenes: ProductoImagenResponse[];
  ofertaVigente: OfertaVigenteProductoResponse | null;
  ratingPromedio: number | null;
  totalResenas: number;
}

export interface ResenaProductoResponse {
  id: number;
  productoId: number;
  usuarioId: number;
  nombreUsuario: string;
  pedidoId: number | null;
  compraVerificada: boolean;
  calificacion: number;
  comentario: string;
  fecha: string;
}

export interface CrearOActualizarResenaRequest {
  productoId: number;
  calificacion: number;
  comentario?: string | null;
}

export interface PedidoListadoProductoResponse {
  idProducto: number;
  sku: string;
  nombre: string;
  cantidad: number;
}

export interface PedidoListadoResponse {
  idPedido: number;
  estado: string;
  total: number;
  fechaCreacion: string;
  cantidadItems: number;
  productos: PedidoListadoProductoResponse[];
}

export interface PedidoItemResponse {
  productoId: number;
  sku: string;
  nombre: string;
  cantidad: number;
  precioFinalUnitario: number;
  totalLinea: number;
}

export interface PedidoResponse {
  id: number;
  usuarioId: number;
  estado: string;
  moneda: string;
  subtotal: number;
  impuesto: number;
  costoEnvio: number;
  total: number;
  needsRecalc: boolean;
  items: PedidoItemResponse[];
}

export interface CrearPedidoRequest {
  moneda?: string;
  direccionEnvioId?: number | null;
  direccionFacturaId?: number | null;
}

export interface FacturaResponse {
  id: number;
  pedidoId: number;
  numeroFactura: string;
  estadoFactura: string;
  subtotal: number;
  impuesto: number;
  costoEnvio: number;
  totalNeto: number;
  moneda: string;
}

export interface CarritoItemResponse {
  idItem: number;
  idProducto: number;
  sku: string;
  slug: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  moneda: string;
}

export interface ResumenCarritoResponse {
  cantidadProductosDistintos: number;
  cantidadUnidades: number;
  subtotal: number;
  total: number;
  moneda: string;
}

export interface CarritoResponse {
  idCarrito: number;
  idUsuario: number;
  estado: string;
  items: CarritoItemResponse[];
  resumen: ResumenCarritoResponse;
}

export interface ResumenCheckoutResponse {
  cantidadItems: number;
  subtotal: number;
  impuesto: number;
  costoEnvio: number;
  total: number;
  moneda: string;
}

export interface ItemResumenCheckoutResponse {
  idProducto: number;
  sku: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface DireccionCheckoutResponse {
  nombreCompleto: string;
  correoElectronico: string;
  telefono: string;
  direccion: string;
  apartamentoInterior: string | null;
  ciudad: string;
  estadoRegion: string;
  codigoPostal: string;
  pais: string;
  referenciaEntrega: string | null;
}

export interface GuardarEnvioPayload {
  pedidoId: number;
  direccionEnvioId?: number | null;
  direccionFacturaId?: number | null;
  direccionEnvio?: {
    nombreCompleto: string;
    correoElectronico: string;
    telefono: string;
    direccion: string;
    apartamentoInterior: string | null;
    ciudad: string;
    estadoRegion: string;
    codigoPostal: string;
    pais: string;
    referenciaEntrega: string | null;
  };
  direccionFactura?: {
    nombreCompleto: string;
    correoElectronico: string;
    telefono: string;
    direccion: string;
    apartamentoInterior: string | null;
    ciudad: string;
    estadoRegion: string;
    codigoPostal: string;
    pais: string;
    referenciaEntrega: string | null;
  } | null;
  mismaDireccionFacturacion: boolean;
}

export interface ProcesarPagoPayload {
  pedidoId: number;
  metodoPago: {
    tipoPago: string;
    nombreTitular?: string;
    numeroTarjeta?: string;
    fechaVencimiento?: string;
    cvv?: string;
  };
  simularFallo: boolean;
}

export interface IniciarCheckoutResponse {
  pedidoId: number;
  numeroPedido: string;
  estadoPedido: string;
  resumen: ResumenCheckoutResponse;
  items: ItemResumenCheckoutResponse[];
  direccionEnvio: DireccionCheckoutResponse | null;
  direccionFactura: DireccionCheckoutResponse | null;
}

export interface ProcesarPagoResponse {
  pedidoId: number;
  pagoId: number;
  numeroPedido: string;
  estadoPedido: string;
  estadoPago: string;
  metodoPago: string;
  mensaje: string;
  total: number;
  fechaPedido: string;
  fechaEstimadaEntrega: string | null;
}

export interface ConfirmacionPedidoResponse {
  mensaje: string;
  pedidoId: number;
  numeroPedido: string;
  estadoPedido: string;
  estadoPago: string;
  metodoPago: string;
  totalPagado: number;
  cantidadItems: number;
  fechaPedido: string;
  fechaEstimadaEntrega: string | null;
  numeroFactura: string | null;
  direccionEnvio: DireccionCheckoutResponse | null;
  direccionFactura: DireccionCheckoutResponse | null;
  resumen: ResumenCheckoutResponse;
  items: ItemResumenCheckoutResponse[];
}

export interface PagoResponse {
  id: number;
  pedidoId: number;
  estado: string;
  proveedorPago: string;
  referenciaInterna: string;
  monto: number;
  moneda: string;
  tipoPago: string;
}

export type AdminPeriodoAnalitica = 'DIARIO' | 'SEMANAL' | 'MENSUAL';

export interface AdminResumenResponse {
  ingresosTotales: number;
  pedidosTotales: number;
  ticketPromedioGlobal: number;
  cantidadClientesActivos: number;
}

export interface ResumenAdminResponse extends AdminResumenResponse {}

export interface VentaPeriodoResponse {
  periodo: string;
  ingresos: number;
  cantidadPedidos: number;
}

export interface TopVendedorAdminResponse {
  idVendedor: number;
  nombreVendedor: string;
  emailVendedor: string;
  pedidosVendidos: number;
  ingresosGenerados: number;
}

export interface TopProductoAdminResponse {
  idProducto: number;
  nombre: string;
  sku: string;
  slug: string;
  unidadesVendidas: number;
  ingresosGenerados: number;
}

export interface VentaCategoriaAdminResponse {
  idCategoria: number;
  nombreCategoria: string;
  unidadesVendidas: number;
  ingresosGenerados: number;
}

export interface MetodoPagoAdminResponse {
  metodoPago: string;
  cantidadUsos: number;
  montoTotal: number;
}

export interface PedidoEstadoAdminResponse {
  estado: string;
  cantidadPedidos: number;
}

export interface AdminDashboardStats {
  totalUsuarios: number;
  totalVendedores: number | null;
  totalProductos: number | null;
  totalPedidos: number;
  ingresosTotales: number;
  pedidosPendientes: number;
  ticketPromedioGlobal: number;
}

export interface UsuarioAdminResponse extends UsuarioResponse {
  activo: boolean;
  fechaRegistro: string;
  totalPedidos?: number;
  totalGastado?: number;
}

export interface VendedorAdminResponse {
  id: number;
  nombreComercial: string;
  correo: string;
  telefono?: string;
  activo: boolean;
  fechaRegistro: string;
  totalProductos?: number;
  totalVentas?: number;
  calificacionPromedio?: number;
}

export interface AdminAnalytics {
  periodo: AdminPeriodoAnalitica;
  resumen: AdminResumenResponse;
  kpis: AdminDashboardStats;
  ventasPorPeriodo: VentaPeriodoResponse[];
  pedidosPorEstado: PedidoEstadoAdminResponse[];
  metodosPago: MetodoPagoAdminResponse[];
  topVendedores: TopVendedorAdminResponse[];
  topProductos: TopProductoAdminResponse[];
  ventasPorCategoria: VentaCategoriaAdminResponse[];
}

export interface PlatformConfig {
  comisionVendedor: number;
  pedidoMinimo: number;
  envioGratisDesde: number;
  mantenimientoActivo: boolean;
  registroAbierto: boolean;
  vendedoresRequierenAprobacion: boolean;
}

export interface ResumenVendedorResponse {
  ingresosTotales: number;
  ingresosMesActual: number;
  cantidadPedidosVendidos: number;
  ticketPromedio: number;
}

export interface WishlistProductoResponse {
  producto: ProductoListadoResponse;
  fechaAgregado: string;
}

export interface EstadoInteraccionResponse {
  productoId: number;
  liked: boolean;
  deseado: boolean;
}
