import { db } from '../dbConfigs';
import { Request } from 'express';

export const checkProjectPermission = async (
    req: Request,
    project_id: number
): Promise<{ view: boolean; edit: boolean }> => {
    const q = await db.query('SELECT * FROM project WHERE id = $1', [
        project_id,
    ]);

    console.log(q.rows, project_id);

    if (!q.rowCount) {
        throw Error('invalid project');
    }

    const project = q.rows[0];

    if (req.token && req.user) {
        const userId = req.user.id;
        const belongsToProject = project.owner_id === userId;
        if (!project.public_view) {
            return { view: belongsToProject, edit: belongsToProject };
        } else if (!project.public_edit) {
            return { view: true, edit: belongsToProject };
        }
    }

    return { view: project.public_view, edit: project.public_edit };
};
