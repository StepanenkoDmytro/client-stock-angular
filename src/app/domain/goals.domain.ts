export interface IGoal {
    id?: number,
    name: string,
    finishSum: number,
    share?: number,
    status: string,
    approximateDate?: Date,
    /** `true` for opt-in demo rows — cleared by DemoDataService.clear(). */
    isDemo?: boolean,
    /**
     * `true` once the goal is moved to History (archive). Active list shows
     * `!archived`; the Goals/History toggle on `/goals` swaps between the two.
     * Optional + defaults to falsy so existing persisted goals stay active.
     */
    archived?: boolean
}
