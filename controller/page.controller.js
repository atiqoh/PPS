const Page = {};

Page.set_response = (
  code = 200,
  msg = "",
  data = [],
  form_name = "",
  sql = ""
) => {
  const res = {
    status: {
      code: code,
      form_name: form_name,
      msg: msg,
    },
    data: data,
    sql: sql,
  };
  return res;
};

module.exports = Page;
