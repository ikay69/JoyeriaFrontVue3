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

      // Inventario
      {
        path: 'inventario/categorias',
        name: 'CategoriaList',
        component: () => import('@/views/Inventario/Categorias/CategoriaList.vue')
      },
      {
        path: 'inventario/categorias/nueva',
        name: 'CategoriaNueva',
        component: () => import('@/views/Inventario/Categorias/CategoriaForm.vue')
      },
      {
        path: 'inventario/categorias/:EmpId/:CatId/editar',
        name: 'CategoriaEditar',
        component: () => import('@/views/Inventario/Categorias/CategoriaForm.vue'),
        props: true
      },
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
      {
        path: 'inventario/propiedades',
        name: 'Propiedades',
        component: () => import('@/views/Inventario/Propiedades/Propiedades.vue')
      },
      {
        path: 'inventario/productos',
        name: 'Productos',
        component: () => import('@/views/Inventario/Productos/Productos.vue')
      },
      {
        path: 'inventario/articulos',
        name: 'Articulos',
        component: () => import('@/views/Inventario/Articulos/Articulos.vue')
      },
      {
        path: 'inventario/movimientos',
        name: 'MovimientosInventario',
        component: () =>
          import('@/views/Inventario/MovimientosInventario/MovimientosInventario.vue')
      },

      // Terceros
      { path: 'terceros', name: 'Terceros', component: () => import('@/views/Terceros/Terceros.vue') },

      // Ventas / Compras / Prestamos / Empenos / Abonos / Gastos
      { path: 'ventas', name: 'Ventas', component: () => import('@/views/Ventas/Ventas.vue') },
      { path: 'compras', name: 'Compras', component: () => import('@/views/Compras/Compras.vue') },
      { path: 'prestamos', name: 'Prestamos', component: () => import('@/views/Prestamos/Prestamos.vue') },
      { path: 'empenos', name: 'Empenos', component: () => import('@/views/Empenos/Empenos.vue') },
      { path: 'abonos', name: 'Abonos', component: () => import('@/views/Abonos/Abonos.vue') },
      { path: 'gastos', name: 'Gastos', component: () => import('@/views/Gastos/Gastos.vue') },

      // Contabilidad
      {
        path: 'contabilidad/movimiento-caja',
        name: 'MovimientoCaja',
        component: () => import('@/views/Contabilidad/MovimientoCaja/MovimientoCaja.vue')
      },
      {
        path: 'contabilidad/estado-cuenta-tercero',
        name: 'EstadoCuentaTercero',
        component: () =>
          import('@/views/Contabilidad/EstadoCuentaTercero/EstadoCuentaTercero.vue')
      },

      // Administracion
      {
        path: 'administracion/usuarios',
        name: 'Usuarios',
        component: () => import('@/views/Administracion/Usuarios/Usuarios.vue')
      },
      {
        path: 'administracion/empresas',
        name: 'Empresas',
        component: () => import('@/views/Administracion/Empresas/Empresas.vue')
      },
      {
        path: 'administracion/asignacion-usuario',
        name: 'AsignacionUsuario',
        component: () =>
          import('@/views/Administracion/AsignacionUsuario/AsignacionUsuario.vue')
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