import app from '../src/index'

export const config = { runtime: 'edge' }
export default (req: Request) => app.handle(req)
