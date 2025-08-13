export default function Overview() {
        return (
                <>
                        <h2 className="h4 mb-3">Overview</h2>
                        <div className="row g-3">
                                <div className="col-12 col-md-6 col-xl-3">
                                        <div className="card shadow-sm border-0 h-100">
                                                <div className="card-body">
                                                        <div className="text-secondary small">Total Rooms</div>
                                                        <div className="display-6 fw-bold">—</div>
                                                </div>
                                        </div>
                                </div>
                                <div className="col-12 col-md-6 col-xl-3">
                                        <div className="card shadow-sm border-0 h-100">
                                                <div className="card-body">
                                                        <div className="text-secondary small">Pending Requests</div>
                                                        <div className="display-6 fw-bold">—</div>
                                                </div>
                                        </div>
                                </div>
                                <div className="col-12 col-md-6 col-xl-3">
                                        <div className="card shadow-sm border-0 h-100">
                                                <div className="card-body">
                                                        <div className="text-secondary small">Approved Today</div>
                                                        <div className="display-6 fw-bold">—</div>
                                                </div>
                                        </div>
                                </div>
                                <div className="col-12 col-md-6 col-xl-3">
                                        <div className="card shadow-sm border-0 h-100">
                                                <div className="card-body">
                                                        <div className="text-secondary small">Cancelled</div>
                                                        <div className="display-6 fw-bold">—</div>
                                                </div>
                                        </div>
                                </div>
                        </div>

                        <div className="card shadow-sm border-0 mt-3">
                                <div className="card-body">
                                        <div className="text-secondary small mb-2">Recent activity</div>
                                        <div className="list-group list-group-flush">
                                                <div className="list-group-item">—</div>
                                                <div className="list-group-item">—</div>
                                                <div className="list-group-item">—</div>
                                        </div>
                                </div>
                        </div>
                </>
        );
}
