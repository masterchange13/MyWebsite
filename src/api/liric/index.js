import request from "@/utils/request";

const GetLiricInfo = ({ id }) => {
    return request
        .get('/lyric', {
            params: {
                id,
            },
        })
        .then((result) => {
            return result.data
        })
}

export default {
    GetLiricInfo,
};