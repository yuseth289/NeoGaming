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
  size: number;
  number: number;
}

export interface LoginResponse {
  token: string;
  usuarioId: number;
  nombre: string;
  email: string;
  rol: string;
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
  telefono: string | null;
  sobreMi: string | null;
  prefiereNoticias: boolean;
  prefiereOfertas: boolean;
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

export interface WishlistProductoResponse {
  producto: ProductoListadoResponse;
  fechaAgregado: string;
}

export interface EstadoInteraccionResponse {
  productoId: number;
  liked: boolean;
  deseado: boolean;
}
