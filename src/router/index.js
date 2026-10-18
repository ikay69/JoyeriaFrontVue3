import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: { name: 'Inicio' },
    children: [
      { path: 'inicio', name: 'Inicio', component: () => import('@/views/Inicio/Inicio.vue') },


      // BODEGAS
      {
        name: 'Bodegas',
        path: 'inventario/bodegas',
        component: () => import('@/views/Inventario/Bodegas/BodegasList.vue')
      },
      {
        name: 'BodegasNueva', 
        path: 'inventario/bodegas/nueva',
        component: () => import('@/views/Inventario/Bodegas/BodegasForm.vue')
      },
      {
        name: 'BodegasEditar', 
        path: 'inventario/bodegas/:EmpId/:BodId/editar',
        component: () => import('@/views/Inventario/Bodegas/BodegasForm.vue'),
        props: true
      },
      
      // Inventario
      {
        name: 'CategoriaList', 
        path: 'inventario/categorias',
        component: () => import('@/views/Inventario/Categorias/CategoriaList.vue')
      },
      {
        name: 'CategoriaNueva',
        path: 'inventario/categorias/nueva',
        component: () => import('@/views/Inventario/Categorias/CategoriaForm.vue')
      },
      {
        name: 'CategoriaEditar', 
        path: 'inventario/categorias/:EmpId/:CatId/editar',
        component: () => import('@/views/Inventario/Categorias/CategoriaForm.vue'),
        props: true
      },
      // UNIDAEDS MEDIDAS
      {
        path: 'inventario/unidades-medida',
        name: 'UnidadesMedida',
        component: () => import('@/views/Inventario/UnidadesMedida/UnidadesMedidaList.vue')
      },
      {
        path: 'inventario/unidades-medida/nueva',
        name: 'UnidadesMedidaNueva',
        component: () => import('@/views/Inventario/UnidadesMedida/UnidadesMedidaForm.vue')
      },
      {
        path: 'inventario/unidades-medida/:EmpId/:UniMedId/editar',
        name: 'UnidadesMedidaEditar',
        component: () => import('@/views/Inventario/UnidadesMedida/UnidadesMedidaForm.vue'),
        props: true
      },
            // PROPIEDAES
      {
        path: 'inventario/propiedades',
        name: 'Propiedades',
        component: () => import('@/views/Inventario/Propiedades/PropiedadesList.vue')
      },
      {
        path: 'inventario/propiedades/nueva',
        name: 'PropiedadesNueva',
        component: () => import('@/views/Inventario/Propiedades/PropiedadesForm.vue')
      },
      {
        path: 'inventario/propiedades/:EmpId/:PropId/editar',
        name: 'PropiedadesEditar',
        component: () => import('@/views/Inventario/Propiedades/PropiedadesForm.vue'),
        props: true
      },

      
      // TIPO DE PRODUCTO
      {
        path: 'inventario/tipo-productos',
        name: 'TipoProductos',
        component: () => import('@/views/Inventario/TipoProductos/TipoProductosList.vue')
      },
      {
        path: 'inventario/tipo-productos/nuevo',
        name: 'TipoProductosNuevo',
        component: () => import('@/views/Inventario/TipoProductos/TipoProductosFrom.vue')
      },
      {
        path: 'inventario/tipo-productos/:EmpId/:TipProId/editar',
        name: 'TipoProductosEditar',
        component: () => import('@/views/Inventario/TipoProductos/TipoProductosFrom.vue'),
        props: true
      },

      // PRODUCTO ANTERIOR 

      // PRODUCTO
      {
        path: 'inventario/productos',
        name: 'Productos',
        component: () => import('@/views/Inventario/Productos/ProductosList.vue')
      },
      {
        path: 'inventario/productos/nuevo',
        name: 'ProductosNuevo',
        component: () => import('@/views/Inventario/Productos/ProductosForm.vue')
      },
      {
        path: 'inventario/productos/:EmpId/:ProdId/editar',
        name: 'ProductosEditar',
        component: () => import('@/views/Inventario/Productos/ProductosForm.vue'),
        props: true
      },


      // PRODUCTO ANTERIOR
            {
        path: 'inventario/articulos',
        name: 'Articulos',
        component: () => import('@/views/Inventario/Articulos/ArticulosList.vue')
      },
      {
        path: 'inventario/articulos/nuevo',
        name: 'ArticulosNuevo',
        component: () => import('@/views/Inventario/Articulos/ArticulosForm.vue')
      },
      {
        path: 'inventario/articulos/:EmpId/:ArtId/editar',
        name: 'ArticulosEditar',
        component: () => import('@/views/Inventario/Articulos/ArticulosForm.vue'),
        props: true
      },

      // Informes de inventario
      {
        path: 'informes-inventario/existencias',
        name: 'Existencias',
        component: () => import('@/views/InformesInventario/Existencias.vue')
      },
      {
        path: 'informes-inventario/kardex',
        name: 'Kardex',
        component: () => import('@/views/InformesInventario/Kardex.vue')
      },
      {
        path: 'informes-inventario/existencia-articulo',
        name: 'ExistenciaArticulo',
        component: () => import('@/views/InformesInventario/ExistenciaArticulo.vue')
      },
      {
        path: 'informes-inventario/ajustes/nuevo',
        name: 'AjusteNuevo',
        component: () => import('@/views/InformesInventario/AjusteForm.vue')
      },

      


      // Clientes
      {
        path: 'clientes',
        name: 'Clientes',
        component: () => import('@/views/Clientes/ClientesList.vue')
      },
      {
        path: 'clientes/nuevo',
        name: 'ClientesNuevo',
        component: () => import('@/views/Clientes/ClientesForm.vue')
      },
      {
        path: 'clientes/:EmpId/:TerId/editar',
        name: 'ClientesEditar',
        component: () => import('@/views/Clientes/ClientesForm.vue'),
        props: true
      },

      // Proveedores
      {
        path: 'proveedores',
        name: 'Proveedores',
        component: () => import('@/views/Proveedores/ProveedoresList.vue')
      },
      {
        path: 'proveedores/nuevo',
        name: 'ProveedoresNuevo',
        component: () => import('@/views/Proveedores/ProveedoresForm.vue')
      },
      {
        path: 'proveedores/:EmpId/:TerId/editar',
        name: 'ProveedoresEditar',
        component: () => import('@/views/Proveedores/ProveedoresForm.vue'),
        props: true
      },

      // Talleres
      {
        path: 'talleres',
        name: 'Talleres',
        component: () => import('@/views/Talleres/TalleresList.vue')
      },
      {
        path: 'talleres/nuevo',
        name: 'TalleresNuevo',
        component: () => import('@/views/Talleres/TalleresForm.vue')
      },
      {
        path: 'talleres/:EmpId/:TerId/editar',
        name: 'TalleresEditar',
        component: () => import('@/views/Talleres/TalleresForm.vue'),
        props: true
      },


      // Ventas 
      
      {
        path: 'ventas/vendedores',
        name: 'Vendedores',
        component: () => import('@/views/Ventas/VendedoresList.vue')
      },
      {
        path: 'ventas/vendedores/nuevo',
        name: 'VendedoresNuevo',
        component: () => import('@/views/Ventas/VendedoresForm.vue')
      },
      {
        path: 'ventas/vendedores/:EmpId/:VdrId/editar',
        name: 'VendedoresEditar',
        component: () => import('@/views/Ventas/VendedoresForm.vue'),
        props: true
      },

      { path: 'ventas', name: 'Ventas', 
        component: () => import('@/views/Ventas/VentasList.vue') 
      },
      {
        path: 'ventas/nueva',  name: 'VentasNuevo',
        component: () => import('@/views/Ventas/VentasForm.vue')
      },
      {
        path: 'ventas/:EmpId/:VentaId/detalle', name: 'VentasDetalle',
        component: () => import('@/views/Ventas/VentasDetalle.vue'),
        props: true
      },

      // Compras 
      { path: 'compras', name: 'ComprasList', component: () => import('@/views/Compras/ComprasList.vue') },
      { path: 'compras/nueva', name: 'CompraNueva', component: () => import('@/views/Compras/CompraForm.vue') },
      {
        path: 'compras/:EmpId/:ComId/detalle',
        name: 'CompraDetalle',
        component: () => import('@/views/Compras/CompraDetalle.vue'),
        props: true
      },




      // Orden de produccion
      // Tres rutas, pero la tercera es un DETALLE y no un editar: una orden de produccion no
      // se edita ni se anula, el backend solo tiene alta y consulta.
      {
        path: 'orden-produccion',
        name: 'OrdenProduccionList',
        component: () => import('@/views/OrdenProduccion/OrdenProduccionList.vue')
      },
      {
        path: 'orden-produccion/nueva',
        name: 'OrdenProduccionNueva',
        component: () => import('@/views/OrdenProduccion/OrdenProduccionForm.vue')
      },
      {
        path: 'orden-produccion/:EmpId/:OrdId',
        name: 'OrdenProduccionDetalle',
        component: () => import('@/views/OrdenProduccion/OrdenProduccionDetalle.vue'),
        props: true
      },

      // Prestamos / Empenos / Abonos 
      { path: 'prestamos', name: 'Prestamos', component: () => import('@/views/Prestamos/Prestamos.vue') },
      { path: 'empenos', name: 'Empenos', component: () => import('@/views/Empenos/EmpenosList.vue') },
      { path: 'empenos/nuevo', name: 'EmpenosNuevo', component: () => import('@/views/Empenos/EmpenosForm.vue') },
      {
        path: 'empenos/:EmpId/:EmpenoId/detalle',
        name: 'EmpenosDetalle',
        component: () => import('@/views/Empenos/EmpenosDetalle.vue'),
        props: true
      },
      { path: 'empenos/pagos', name: 'EmpenosPagos', component: () => import('@/views/Empenos/PagosEmpenos.vue') },
      { path: 'abonos', name: 'Abonos', component: () => import('@/views/Abonos/Abonos.vue') },
      
      
      // Gastos
      {
        path: 'gastos',
        name: 'Gastos',
        component: () => import('@/views/Gastos/GastosList.vue')
      },
      {
        path: 'gastos/nuevo',
        name: 'GastosNuevo',
        component: () => import('@/views/Gastos/GastosForm.vue')
      },
      {
        path: 'gastos/:EmpId/:GasId/editar',
        name: 'GastosEditar',
        component: () => import('@/views/Gastos/GastosForm.vue'),
        props: true
      },
      {
        path: 'gastos/:EmpId/:GasId',
        name: 'GastosDetalle',
        component: () => import('@/views/Gastos/GastosDetalle.vue'),
        props: true
      },

      // Contabilidad
      // Las tres rutas de Movimiento en caja NO son las del patron List + Form: la tercera es
      // un DETALLE, no un editar. Un movimiento de caja no se edita nunca, solo se anula.
      {
        path: 'contabilidad/movimiento-caja',
        name: 'MovimientoCaja',
        component: () => import('@/views/Contabilidad/MovimientoCaja/MovimientoCajaList.vue')
      },
      {
        path: 'contabilidad/movimiento-caja/nuevo',
        name: 'MovimientoCajaNuevo',
        component: () => import('@/views/Contabilidad/MovimientoCaja/MovimientoCajaForm.vue')
      },
      {
        path: 'contabilidad/movimiento-caja/:EmpId/:MovId',
        name: 'MovimientoCajaDetalle',
        component: () => import('@/views/Contabilidad/MovimientoCaja/MovimientoCajaDetalle.vue'),
        props: true
      },
      {
        path: 'contabilidad/estado-cuenta-tercero',
        name: 'EstadoCuentaTercero',
        component: () =>
          import('@/views/Contabilidad/EstadoCuentaTercero/EstadoCuentaTercero.vue')
      },

      // Administracion
      //usuarios
      { 
        path: 'administracion/usuarios', 
        name: 'Usuarios', 
        component: () => import('@/views/Administracion/Usuarios/UsuarioList.vue')
      },

      { 
        path: 'administracion/usuarios/nuevo', 
        name: 'UsuarioNuevo', 
        component: () => import('@/views/Administracion/Usuarios/UsuarioForm.vue')
      },
      { 
        path: 'administracion/usuarios/:UsuId/editar', 
        name: 'UsuarioEditar', 
        component:  () => import('@/views/Administracion/Usuarios/UsuarioForm.vue')
      },  
      //empresas
   
      {
        path: 'administracion/empresas',
        name: 'Empresas',
        component: () => import('@/views/Administracion/Empresas/EmpresaList.vue')
      },
      {
        path: 'administracion/empresas/:EmpId/editar',
        name: 'EmpresaEditar',
        component: () => import('@/views/Administracion/Empresas/EmpresaForm.vue'),
        props: true
      },



      //asingar usuario empresa
      {
        path: 'administracion/asignacion-usuario',
        name: 'AsignacionUsuario',
        component: () =>
          import('@/views/Administracion/AsignacionUsuario/AsignacionUsuario.vue')
      },
      //tipo documento
      {
        path: 'administracion/tipos-documento',
        name: 'TiposDocumento',
        component: () => import('@/views/Administracion/TiposDocumento/TiposDocumentoList.vue')
      },
      {
        path: 'administracion/tipos-documento/nuevo',
        name: 'TiposDocumentoNuevo',
        component: () => import('@/views/Administracion/TiposDocumento/TiposDocumentoForm.vue')
      },
      {
        path: 'administracion/tipos-documento/:EmpId/:TipDocId/editar',
        name: 'TiposDocumentoEditar',
        component: () => import('@/views/Administracion/TiposDocumento/TiposDocumentoForm.vue'),
        props: true
      },
      //tipo gasto
      {
        path: 'administracion/tipos-gastos',
        name: 'TiposGastos',
        component: () => import('@/views/Administracion/TiposGastos/TiposGastosList.vue')
      },
      {
        path: 'administracion/tipos-gastos/nuevo',
        name: 'TiposGastosNuevo',
        component: () => import('@/views/Administracion/TiposGastos/TiposGastosForm.vue')
      },
      {
        path: 'administracion/tipos-gastos/:EmpId/:TipGasId/editar',
        name: 'TiposGastosEditar',
        component: () => import('@/views/Administracion/TiposGastos/TiposGastosForm.vue'),
        props: true
      }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (!to.meta.public && !authStore.isAuthenticated) {
    return { name: 'Login' }
  }

  if (to.name === 'Login' && authStore.isAuthenticated) {
    return { name: 'Inicio' }
  }

  return true
})

export default router
