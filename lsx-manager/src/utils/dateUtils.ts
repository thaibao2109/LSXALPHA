export const formatDateWithRemaining = (dateStr: string): string => {
    if (!dateStr) return '';

    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        // Format DD/MM/YYYY
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;

        // Calculate days remaining
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let remainingText = '';
        if (diffDays > 0) {
            remainingText = `(Còn ${diffDays} ngày)`;
        } else if (diffDays < 0) {
            remainingText = `(Trễ ${Math.abs(diffDays)} ngày)`;
        } else {
            remainingText = `(Hôm nay)`;
        }

        return `${formattedDate} ${remainingText}`;
    } catch (e) {
        return dateStr;
    }
};
