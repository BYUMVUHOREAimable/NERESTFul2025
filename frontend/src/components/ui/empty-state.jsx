export const EmptyState = ({ icon, title, description, action }) => {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {icon && <div className="text-gray-400 mb-4">{icon}</div>}
        {title && <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>}
        {description && <p className="text-sm text-gray-500 max-w-md mb-6">{description}</p>}
        {action && action}
      </div>
    )
  }
  