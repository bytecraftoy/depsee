import { router } from '../router';
import { Request, Response } from 'express';
import { IProject, UserData } from '../../../../../types';
//import {IError} from '../../domain/IError';
import { db } from '../../dbConfigs';
import {
    checkProjectPermissionByNodeTypeId,
    checkProjectPermissionByProjectId,
} from '../../helper/permissionHelper';

/* let projects: Array<IProject> = [{id: '1', name: 'test'}]; */

/**
 * GET /api/project/:id
 * @summary Get a project
 * @description Get a project where the user has access to.
 * @pathParam {string} id - Id of the project
 * @response 200 - OK
 * @response 401 - Unauthorized
 */
router
    .route('/project/:id')
    .get(async (req: Request, res: Response) => {
        const { view, projectId } = await checkProjectPermissionByProjectId(
            req,
            parseInt(req.params.id)
        );

        if (!projectId || !view) {
            return res.status(401).json({ message: 'No permission' });
        }
        const q = await db.query('SELECT * FROM project WHERE id = $1', [
            projectId,
        ]);
        res.json(q.rows[0]);
    })
    /**
     * DELETE /api/project/:id
     * @summary Delete a project
     * @description Delete the project with a specific id from the application
     * @pathParam {string} id - Id of the project to delete
     * @response 200 - OK
     * @response 401 - Unauthorized
     */
    .delete(async (req: Request, res: Response) => {
        const { view, projectId } = await checkProjectPermissionByProjectId(
            req,
            parseInt(req.params.id)
        );

        if (!projectId || !view) {
            return res.status(401).json({ message: 'No permission' });
        }
        const ownerId = req.user?.id;

        const q = await db.query(
            'DELETE FROM project WHERE id = $1 AND owner_id = $2',
            [projectId, ownerId]
        );
        res.status(200).json(q);
    });

/**
 * GET /api/project/:id/permission
 * @summary Get permissions of a project
 * @description Depending on whether the user has been added to the project, they may view and/or edit the project
 * @pathParam {string} id - Id of the project to check permissions from
 * @response 200 - OK
 */
router
    .route('/project/:id/permission')
    .get(async (req: Request, res: Response) => {
        const project_id = parseInt(req.params.id);

        const permissions = await checkProjectPermissionByProjectId(
            req,
            project_id
        );
        res.json(permissions);
    });

/**
 * GET /api/project
 * @summary Get all projects
 * @description Get all projects where the user has access to.
 * @response 200 - OK
 * @response 401 - Unauthorized
 */
router
    .route('/project')
    .get(async (req: Request, res: Response) => {
        if (!req.token || !req.user) {
            return res.status(401).json({ error: 'token missing or invalid' });
        }

        const userId = req.user.id;
        const q = await db.query(
            `SELECT * FROM project
            WHERE id IN (
                SELECT project_id FROM users__project
                WHERE users_id = $1
            )`,
            [userId]
        );
        res.json(q.rows);
    })
    /**
     * POST /api/project
     * @summary Create a project
     * @description Create a **project** with predefined permissions. The given user in the body will automatically be the owner
     * @bodyContent {Project} - application/json
     * @bodyRequired
     * @response 200 - OK
     * @response 401 - Unauthorized
     * @response 403 - Forbidden
     */
    .post(async (req: Request, res: Response) => {
        if (!req.token || !req.user) {
            return res.status(401).json({ error: 'token missing or invalid' });
        }

        const project: IProject = req.body;

        const ownerId = req.user.id;
        if (project.owner_id !== ownerId) {
            return res.status(401).json({ error: 'invalid owner id' });
        }

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            req.logger.info({
                message: 'Creating project and assigning creator to it',
                name: project.name,
                ownerId,
            });

            const q = await client.query(
                'INSERT INTO project (name, owner_id, description, public_view, public_edit) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [
                    project.name,
                    project.owner_id,
                    project.description,
                    project.public_view,
                    project.public_edit,
                ]
            );

            const projectId = q.rows[0].id;

            client.query(
                'INSERT INTO users__project (users_id, project_id) VALUES ($1, $2)',
                [project.owner_id, projectId]
            );
            client.query('COMMIT');
            res.status(200).json({ id: projectId });
        } catch (e) {
            req.logger.info({ message: 'Exception', err: e });
            await client.query('ROLLBACK');
            res.status(403).json();
        } finally {
            client.release();
        }
    })
    /**
     * PUT /api/project
     * @summary Update project details
     * @description Update details of the **project** with the given id in the body with the settings in the body
     * @bodyRequired
     * @bodyContent {Project} - application/json
     * @response 200 - OK
     * @response 401 - Unauthorized
     *
     */
    .put(async (req: Request, res: Response) => {
        const p: IProject = req.body;

        const { projectId, edit } = await checkProjectPermissionByProjectId(
            req,
            p.id
        );

        if (!projectId || !edit) {
            return res.status(401).json({ message: 'No permission' });
        }

        req.logger.info({
            message: 'Updating project details',
            projectId,
        });

        const q = await db.query(
            'UPDATE project SET name = $1, description = $2, public_view = $3, public_edit = $4 WHERE id = $5 AND owner_id = $6',
            [
                p.name,
                p.description,
                p.public_view,
                p.public_edit,
                projectId,
                p.owner_id,
            ]
        );
        res.status(200).json(q);
    })
    .delete(async (req: Request, res: Response) => {
        res.status(404).json({ message: 'Not implemented' });
    });

/**
 * GET /api/project/:id/members
 * @summary Get members that belong to the project
 * @description Gets every member that belongs to the corresponding project
 * @pathParam {string} id - Project id
 * @response 200 - OK
 * @response 401 - Unauthorized
 */
router
    .route('/project/:id/members')
    .get(async (req: Request, res: Response) => {
        const { projectId, view } = await checkProjectPermissionByProjectId(
            req,
            parseInt(req.params.id)
        );

        if (!projectId || !view) {
            return res.status(401).json({ message: 'No permission' });
        }

        const query = await db.query(
            `SELECT username, email, id FROM users
            WHERE id IN (
                SELECT users_id FROM users__project
                WHERE project_id = $1
            )`,
            [projectId]
        );

        return res.status(200).json(query.rows);
    })
    /**
     * POST /api/project/:id/members
     * @summary Add a member to the project
     * @description Adds a member to a existing project. The added user gets the right to edit the project and invite users.
     * @pathParam {string} id - Project id
     * @bodyContent {string} - id of the user
     * @bodyRequired
     * @response 200 - OK
     * @response 401 - Unauthorized
     */
    .post(async (req: Request, res: Response) => {
        const { edit, projectId } = await checkProjectPermissionByProjectId(
            req,
            parseInt(req.params.id)
        );

        const invite: string = req.body.member;

        // Test whether inviter belongs in project
        if (!edit) {
            return res.status(401).json({ message: 'No permission' });
        }

        // Invite users
        try {
            const user: UserData = (
                await db.query(
                    'SELECT username, email, id FROM users WHERE username = $1 OR email = $1',
                    [invite]
                )
            ).rows[0];

            req.logger.info({
                message: 'Adding user to project',
                projectId,
                addedUserId: user.id,
            });

            await db.query(
                'INSERT INTO users__project (users_id, project_id) VALUES ($1, $2)',
                [user.id, projectId]
            );

            res.status(200).json(user);
        } catch (e) {
            req.logger.info({ message: 'Exception', err: e });
            res.status(403).json();
        }
    });

/**
 * DELETE /api/project/:id
 * @summary Delete a project
 * @description Deletes the specific project with id ':id'.
 * @pathParam {string} id - Project id
 * @response 200 - OK
 * @response 401 - Unauthorized
 * @response 403 - Forbidden
 */
router
    .route('/project/:pid/members/:uid')
    .delete(async (req: Request, res: Response) => {
        const userId = parseInt(req.params.uid);
        const { projectId, edit } = await checkProjectPermissionByProjectId(
            req,
            parseInt(req.params.pid)
        );

        // Test whether inviter belongs in project
        if (!edit) {
            return res.status(401).json({ message: 'No permission' });
        }

        // Test that the person being deleted is not a owner
        const q = await db.query(
            'SELECT * FROM project WHERE id = $1 AND owner_id = $2',
            [projectId, userId]
        );

        if (q.rowCount > 0) {
            return res.status(403).json({ message: 'Cannot delete owner' });
        }

        req.logger.info({
            message: 'Removing user from project',
            projectId: projectId,
            removedUserId: userId,
        });

        await db.query(
            'DELETE FROM users__project WHERE project_id = $1 AND users_id = $2',
            [projectId, userId]
        );

        res.status(200).json();
    });

router
    .route('/project/:pid/type')
    /**
     * GET /api/project/:pid/type
     * @summary Get all node types in project
     * @pathParam {string} pid - Project id
     * @response 200 - OK
     * @response 401 - Unauthorized
     */
    .get(async (req: Request, res: Response) => {
        const { projectId, view } = await checkProjectPermissionByProjectId(
            req,
            parseInt(req.params.pid)
        );

        if (!projectId || !view) {
            return res.status(401).json({ message: 'No permission' });
        }

        const query = await db.query(
            'SELECT id, label, color FROM node_type WHERE project_id = $1',
            [projectId]
        );

        return res.status(200).json(
            query.rows.map((row) => ({
                id: row.id,
                label: row.label,
                color: row.color,
            }))
        );
    })
    /**
     * POST /api/project/:pid/type
     * @bodyRequired
     * @summary Create a new node type
     * @bodyContent {NodeType} - Initial settings for the type
     * @pathParam {string} pid - Project id
     * @response 200 - OK
     * @response 401 - Unauthorized
     */
    .post(async (req: Request, res: Response) => {
        const projectId = parseInt(req.params.pid);

        const permissions = await checkProjectPermissionByProjectId(
            req,
            projectId
        );

        if (!permissions.view) {
            return res.status(401).json({ message: 'No permission' });
        }

        const q = await db.query(
            'INSERT INTO node_type (project_id, label, color) VALUES ($1, $2, $3) RETURNING id',
            [projectId, req.body.label, req.body.color]
        );
        res.status(200).json({ id: q.rows[0].id });
    });

/**
 * PUT /api/project/:pid/type/:typeId
 * @summary Modify a node type
 * @bodyContent {NodeType} - New properties for the type
 * @bodyRequired
 * @pathParam {string} id - Id of the project where the node belongs
 * @pathParam {string} pid - Id of the node
 * @response 200 - OK
 * @response 401 - Unauthorized
 * @response 403 - Forbidden
 */
router
    .route('/project/:pid/type/:typeId')
    .put(async (req: Request, res: Response) => {
        const typeId = parseInt(req.params.typeId);

        const permissions = await checkProjectPermissionByNodeTypeId(
            req,
            typeId
        );

        if (!permissions.view) {
            return res.status(401).json({ message: 'No permission' });
        }

        await db.query('UPDATE node_type SET label=$1, color=$2 WHERE id=$3', [
            req.body.label,
            req.body.color,
            typeId,
        ]);
        res.status(200).json();
    });

/**
 * DELETE /api/project/:id/type/:typeId
 * @summary Delete a node type
 * @pathParam {string} pid - Id of the project where the node belongs
 * @pathParam {string} nodeId - Id of the node
 * @response 200 - OK
 * @response 401 - Unauthorized
 * @response 403 - Forbidden
 */
router
    .route('/project/:pid/type/:typeId')
    .delete(async (req: Request, res: Response) => {
        const typeId = parseInt(req.params.typeId);

        const permissions = await checkProjectPermissionByNodeTypeId(
            req,
            typeId
        );

        if (!permissions.view) {
            return res.status(401).json({ message: 'No permission' });
        }

        await db.query('DELETE FROM node_type WHERE id=$1', [typeId]);
        res.status(200).json();
    });

export { router as project };
