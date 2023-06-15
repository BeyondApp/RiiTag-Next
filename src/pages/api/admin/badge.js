import HTTP_CODE from "@/lib/constants/httpStatusCodes";
import { ncWithSession } from "@/lib/routing";
import { userIsAdmin } from "@/lib/utils/databaseUtils";
import { isBlank } from "@/lib/utils/utils";

const { makeBanner } = require("@/lib/riitag/banner");

async function updateBadge(request, response) {
    const loggedInUser = request.session?.username;
    const {
        username,
        badge,
    } = request.body;

    if (
        isBlank(username)
    ) {
        return response
            .status(HTTP_CODE.BAD_REQUEST)
            .send({ error: 'Invalid data' });
    }

    if (!loggedInUser) {
        return response
            .status(HTTP_CODE.UNAUTHORIZED)
            .json({ error: 'Unauthorized' });
    }

    if (!(await userIsAdmin(loggedInUser))) {
        return response
            .status(HTTP_CODE.UNAUTHORIZED)
            .json({ error: 'Unauthorized' });
    }

    try {
        const user = await prisma.user.update({
            where: {
                username,
            },
            data: {
                badge,
            },
        });
        // await makeBanner(user);
    } catch (error) {
        logger.error(error);
        return response
            .status(HTTP_CODE.INTERNAL_SERVER_ERROR)
            .send({ error });
    }

    return response.status(HTTP_CODE.OK).send();
}

const handler = ncWithSession().post(updateBadge);

export default handler;