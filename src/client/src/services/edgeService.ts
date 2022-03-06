import axios from 'axios';
import { Edge } from 'react-flow-renderer';
import { IEdge } from '../../../../types';
import { axiosWrapper } from './axiosWrapper';
import { getAuthConfig } from './userService';
export const baseUrl = '/api/edge';

const getAll = async (project_id: number): Promise<IEdge[]> => {
    return (
        (await axiosWrapper(
            axios.get<IEdge[]>(`${baseUrl}/${project_id}`, getAuthConfig())
        )) || []
    );
};

const sendEdge = async (edge: IEdge): Promise<boolean> => {
    return (
        (await axiosWrapper(axios.post(baseUrl, edge, getAuthConfig()))) !==
        undefined
    );
};

const deleteEdge = async (edge: Edge<IEdge>): Promise<void> => {
    await axiosWrapper(
        axios.delete(
            `${baseUrl}/${edge.source}/${edge.target}`,
            getAuthConfig()
        )
    );
};

export { getAll, sendEdge, deleteEdge };
