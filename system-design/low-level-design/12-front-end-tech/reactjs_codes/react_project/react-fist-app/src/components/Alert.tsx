interface Props {
    type?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
    message: string;
}

function Alert({ type = 'primary', message }: Props) {
    return (
        <div className={`alert alert-${type}`} role="alert">
            {message}
        </div>
    );
}

export default Alert;
