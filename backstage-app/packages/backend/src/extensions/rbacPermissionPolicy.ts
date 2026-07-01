import { createBackendModule, coreServices } from '@backstage/backend-plugin-api';
import {
  PolicyDecision,
  AuthorizeResult,
  ResourcePermission,
} from '@backstage/plugin-permission-common';
import {
  PermissionPolicy,
  PolicyQuery,
  PolicyQueryUser,
} from '@backstage/plugin-permission-node';
import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';
import { catalogConditions, createCatalogConditionalDecision } from '@backstage/plugin-catalog-backend/alpha';

class RoleBasedPermissionPolicy implements PermissionPolicy {
  constructor(private readonly logger: any) {}

  async handle(
    request: PolicyQuery,
    user?: PolicyQueryUser,
  ): Promise<PolicyDecision> {
    const isGuest = !user || !user.info || !user.info.ownershipEntityRefs || user.info.ownershipEntityRefs.length === 0;
    
    // Admins have 'admin' or 'polfenollar' in their ownership references
    const isAdmin = user?.info?.ownershipEntityRefs?.some(
      (ref: string) => ref.includes('admin') || ref.includes('polfenollar')
    );

    // 1. Admin Override (Full access)
    if (isAdmin) {
      return { result: AuthorizeResult.ALLOW };
    }

    // 2. Protect Catalog Entity Deletion
    if (request.permission.name === 'catalog.entity.delete') {
      if (isGuest) {
        this.logger.warn(`Permission denied: Guest user attempted to delete catalog entity`);
        return { result: AuthorizeResult.DENY };
      }
      
      // Developers can only delete entities they own
      return createCatalogConditionalDecision(
        request.permission as ResourcePermission<'catalog-entity'>,
        catalogConditions.isEntityOwner({
          claims: user?.info?.ownershipEntityRefs ?? [],
        }),
      );
    }

    // 3. Protect Scaffolder Template Play (Triggering templates)
    if (request.permission.name === 'scaffolder.template.play') {
      if (isGuest) {
        this.logger.warn(`Permission denied: Guest user attempted to run scaffolder template`);
        return { result: AuthorizeResult.DENY };
      }
      return { result: AuthorizeResult.ALLOW };
    }

    // 4. Default Posture for standard developers & guests
    // Guests are blocked from all write actions (create, update, delete)
    if (isGuest && (request.permission.attributes?.action === 'create' || request.permission.attributes?.action === 'update' || request.permission.attributes?.action === 'delete')) {
      this.logger.warn(`Permission denied: Guest user attempted write operation: ${request.permission.name}`);
      return { result: AuthorizeResult.DENY };
    }

    if (request.permission.attributes?.action === 'delete' || request.permission.attributes?.action === 'update') {
      this.logger.warn(`Permission denied: Non-admin attempted write/delete on non-owned resource: ${request.permission.name}`);
      return { result: AuthorizeResult.DENY };
    }

    return { result: AuthorizeResult.ALLOW };
  }
}


export default createBackendModule({
  pluginId: 'permission',
  moduleId: 'permission-policy',
  register(reg) {
    reg.registerInit({
      deps: {
        policy: policyExtensionPoint,
        logger: coreServices.logger,
      },
      async init({ policy, logger }) {
        logger.info('Initializing custom Role-Based Access Control (RBAC) Permission Policy');
        policy.setPolicy(new RoleBasedPermissionPolicy(logger));
      },
    });
  },
});
