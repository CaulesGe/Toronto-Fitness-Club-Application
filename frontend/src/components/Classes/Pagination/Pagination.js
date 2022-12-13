import Pagination from '@mui/material/Pagination';

import './Pagination.css';

const SchedulePagination = ({ lastpage, query, setQuery }) => {
	console.log(lastpage, query);
	return (
		<Pagination
			className="schedule-pagination"
			size="large"
			count={lastpage}
			defaultPage={1}
			page={Math.floor(query.offset / 10) + 1}
			onChange={(event, value) => {
				setQuery({ ...query, offset: (value - 1) * 10 });
			}}
		/>
	);
};

const UserSchedulePagination = ({ lastpage, offset, setOffset }) => {
	return (
		<Pagination
			className="schedule-pagination"
			count={lastpage}
			defaultPage={1}
			page={Math.floor(offset / 10) + 1}
			onChange={(event, value) => {
				setOffset((value - 1) * 10);
			}}
		/>
	);
};

export default SchedulePagination;

export { UserSchedulePagination };
