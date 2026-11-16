/* eslint-disable */
// @ts-nocheck
// Automatically generated route tree snapshot. Vite/TanStack Router will regenerate this file.
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as HostRouteImport } from './routes/host'
import { Route as RequestsRouteImport } from './routes/requests'
import { Route as ChatsRouteImport } from './routes/chats'
import { Route as ChatsIdRouteImport } from './routes/chats.$id'
import { Route as ProfileRouteImport } from './routes/profile'
import { Route as SessionIdRouteImport } from './routes/session.$id'

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const HostRoute = HostRouteImport.update({
  id: '/host',
  path: '/host',
  getParentRoute: () => rootRouteImport,
} as any)
const RequestsRoute = RequestsRouteImport.update({
  id: '/requests',
  path: '/requests',
  getParentRoute: () => rootRouteImport,
} as any)
const ChatsRoute = ChatsRouteImport.update({
  id: '/chats',
  path: '/chats',
  getParentRoute: () => rootRouteImport,
} as any)
const ChatsIdRoute = ChatsIdRouteImport.update({
  id: '/$id',
  path: '/$id',
  getParentRoute: () => ChatsRoute,
} as any)
const ProfileRoute = ProfileRouteImport.update({
  id: '/profile',
  path: '/profile',
  getParentRoute: () => rootRouteImport,
} as any)
const SessionIdRoute = SessionIdRouteImport.update({
  id: '/session/$id',
  path: '/session/$id',
  getParentRoute: () => rootRouteImport,
} as any)

const ChatsRouteWithChildren = ChatsRoute._addFileChildren({ ChatsIdRoute })

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/host': typeof HostRoute
  '/requests': typeof RequestsRoute
  '/chats': typeof ChatsRouteWithChildren
  '/chats/$id': typeof ChatsIdRoute
  '/profile': typeof ProfileRoute
  '/session/$id': typeof SessionIdRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/host': typeof HostRoute
  '/requests': typeof RequestsRoute
  '/chats': typeof ChatsRouteWithChildren
  '/chats/$id': typeof ChatsIdRoute
  '/profile': typeof ProfileRoute
  '/session/$id': typeof SessionIdRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/host': typeof HostRoute
  '/requests': typeof RequestsRoute
  '/chats': typeof ChatsRouteWithChildren
  '/chats/$id': typeof ChatsIdRoute
  '/profile': typeof ProfileRoute
  '/session/$id': typeof SessionIdRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/host' | '/requests' | '/chats' | '/chats/$id' | '/profile' | '/session/$id'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/host' | '/requests' | '/chats' | '/chats/$id' | '/profile' | '/session/$id'
  id: '__root__' | '/' | '/host' | '/requests' | '/chats' | '/chats/$id' | '/profile' | '/session/$id'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  HostRoute: typeof HostRoute
  RequestsRoute: typeof RequestsRoute
  ChatsRoute: typeof ChatsRouteWithChildren
  ProfileRoute: typeof ProfileRoute
  SessionIdRoute: typeof SessionIdRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/host': {
      id: '/host'
      path: '/host'
      fullPath: '/host'
      preLoaderRoute: typeof HostRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/requests': {
      id: '/requests'
      path: '/requests'
      fullPath: '/requests'
      preLoaderRoute: typeof RequestsRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/chats': {
      id: '/chats'
      path: '/chats'
      fullPath: '/chats'
      preLoaderRoute: typeof ChatsRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/chats/$id': {
      id: '/chats/$id'
      path: '/$id'
      fullPath: '/chats/$id'
      preLoaderRoute: typeof ChatsIdRouteImport
      parentRoute: typeof ChatsRoute
    }
    '/profile': {
      id: '/profile'
      path: '/profile'
      fullPath: '/profile'
      preLoaderRoute: typeof ProfileRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/session/$id': {
      id: '/session/$id'
      path: '/session/$id'
      fullPath: '/session/$id'
      preLoaderRoute: typeof SessionIdRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  HostRoute: HostRoute,
  RequestsRoute: RequestsRoute,
  ChatsRoute: ChatsRouteWithChildren,
  ProfileRoute: ProfileRoute,
  SessionIdRoute: SessionIdRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
