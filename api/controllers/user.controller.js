import { Router } from "express";

import auth from "../middlewares/auth.js";
import httpStatusCode from "../../utils/enums/httpStatusCode.js";
import userService from "../../bussiness/services/user.service.js";
import logInResponseEnum from "../../utils/enums/logInResponseEnum.js";
import registerResponseEnum from "../../utils/enums/registerResponseEnum.js";
import userResponseEnum from "../../utils/enums/userResponseEnum.js";

const router = Router();

router.post("/auth/user", async (req, res) => {
  const { email, password } = req.body;
  const result = await userService.login(email, password);
  if (result.code !== logInResponseEnum.SUCCESS) {
    return res
      .status(httpStatusCode.CLIENT_ERRORS.BAD_REQUEST)
      .send(result)
      .end();
  }
  // 2 months = 5259600000 miliseconds
  res.cookie("access_token", result.accessToken, {
    sameSite: "none",
    secure: true,
    maxAge: 5259600000,
    path: "/",
    httpOnly: true,
  });
  res.cookie("refresh_token", result.refreshToken, {
    sameSite: "none",
    secure: true,
    maxAge: 5259600000,
    path: "/",
    httpOnly: true,
  });
  res.status(httpStatusCode.SUCCESS.NO_CONTENT).end();
});

router.post("/user", async (req, res) => {
  const { email, name, password, rePassword } = req.body;
  const result = await userService.register(email, name, password, rePassword);
  if (result.code !== registerResponseEnum.SUCCESS) {
    return res
      .status(httpStatusCode.CLIENT_ERRORS.BAD_REQUEST)
      .send(result)
      .end();
  }
  res.status(httpStatusCode.SUCCESS.NO_CONTENT).end();
});

router.post("/confirmation/:token", async (req, res) => {
  const token = req.params.token;
  await userService.confirmEmail(token);
  return res.redirect("https://academy-web-client.netlify.app/login");
});

router.delete("/refresh-token", auth(), async (req, res) => {
  res.clearCookie("refresh_token", { path: "/" });
  res.clearCookie("access_token", { path: "/" });
  res.status(httpStatusCode.SUCCESS.NO_CONTENT).end();
});

router.get("/user", auth(), async (req, res) => {
  const result = await userService.getSelfInfo(req.user.id);
  res
    .status(httpStatusCode.SUCCESS.OK)
    .json({
      email: result.user.email,
      name: result.user.name,
      role: req.user.role,
    })
    .end();
});

router.post("/auth/token", auth(), async (req, res) => {
  res
    .status(httpStatusCode.SUCCESS.OK)
    .json({
      role: req.user.role,
    })
    .end();
});

router.get("/users", auth(), async (req, res) => {
  const page = Number(req.query.page) || 1;
  const role_name = req.query.rolename;
  const result = await userService.getAllByRoleName(role_name, page);
  if (result.code !== userResponseEnum.SUCCESS) {
    return res
      .status(httpStatusCode.CLIENT_ERRORS.BAD_REQUEST)
      .send(result)
      .end();
  }
  res.status(httpStatusCode.SUCCESS.OK).json(result).end();
});

router.put("/update-user", auth(), async (req, res) => {
  const { email, password, name } = req.body;
  const result = await userService.updateUser(email, password, name);
  if (result.code !== logInResponseEnum.SUCCESS) {
    return res
      .status(httpStatusCode.CLIENT_ERRORS.BAD_REQUEST)
      .json(result)
      .end();
  }
  return res.status(httpStatusCode.SUCCESS.NO_CONTENT).end();
});

router.put("/user", auth(["admin"]), async (req, res) => {
  const { id, status } = req.body;
  const result = await userService.updateOneById({ id: id, status: status });
  if (result.code !== userResponseEnum.SUCCESS) {
    return res
      .status(httpStatusCode.CLIENT_ERRORS.BAD_REQUEST)
      .json(result)
      .end();
  }
  res.status(httpStatusCode.SUCCESS.OK).json(result);
});

router.post("/teacher", auth(["admin"]), async (req, res) => {
  const { email, name } = req.body;
  const result = await userService.addOne(email, name);
  if (result.code !== userResponseEnum.SUCCESS) {
    return res
      .status(httpStatusCode.CLIENT_ERRORS.BAD_REQUEST)
      .send(result)
      .end();
  }
  res.status(httpStatusCode.SUCCESS.CREATED).end();
});

router.get("/teachers", auth(["admin"]), async (req, res) => {
  const result = await userService.getAllByRoleTeacher();
  if (result.code !== userResponseEnum.SUCCESS) {
    return res
      .status(httpStatusCode.CLIENT_ERRORS.BAD_REQUEST)
      .send(result)
      .end();
  }
  res.status(httpStatusCode.SUCCESS.OK).json(result).end();
});

export default router;
