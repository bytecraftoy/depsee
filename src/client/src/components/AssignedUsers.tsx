import { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { INode, UserData } from '../../../../types';
import { getAssignedUsers } from '../services/assignmentService';
import './styles/Sidebar.css';
import { BsFillPeopleFill } from 'react-icons/bs';

interface assignedUsersProps {
    node: INode;
}

export const AssignedUsers = (props: assignedUsersProps): JSX.Element => {
    const nodeId = props.node.id;
    if (!nodeId) return <></>;

    const [assigned, setAssigned] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getAssignedUsers(nodeId)
            .then(async (users) => {
                setAssigned(users);
                setIsLoading(false);
            })
            .catch(() => setAssigned([]));
    }, []);

    return assigned.length ? (
        <div>
            <p>
                <BsFillPeopleFill className="icon" /> Assigned users:
            </p>
            {isLoading ? (
                <Spinner animation="border" />
            ) : (
                <ul>
                    {assigned.map((user, i) => (
                        <li key={i}>{user.username}</li>
                    ))}
                </ul>
            )}
        </div>
    ) : (
        <></>
    );
};
